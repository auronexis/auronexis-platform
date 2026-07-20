import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type PaddleIdempotencyStatus = "proceed" | "duplicate" | "retry" | "unavailable";

export type PaddleIdempotencyResult = {
  status: PaddleIdempotencyStatus;
};

/** Stuck `processing` rows older than this may be retried safely (Paddle redelivery). */
const PROCESSING_STALE_MS = 5 * 60 * 1000;

function hashPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

export async function ensurePaddleIdempotency(input: {
  providerEventId: string;
  eventType: string;
  rawBody: string;
  occurredAt?: string | null;
}): Promise<PaddleIdempotencyResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const payloadHash = hashPayload(input.rawBody);

  const { data: existing, error: readError } = await admin
    .from("paddle_webhook_events")
    .select("status, received_at, payload_hash")
    .eq("provider", "paddle")
    .eq("provider_event_id", input.providerEventId)
    .maybeSingle();

  if (readError) {
    console.error("[paddle] idempotency read failed:", {
      message: readError.message,
      eventType: input.eventType,
      providerEventIdPrefix: input.providerEventId.slice(0, 12),
    });
    return { status: "unavailable" };
  }

  const row = existing as {
    status: string;
    received_at?: string | null;
    payload_hash?: string | null;
  } | null;

  if (row?.payload_hash && row.payload_hash !== payloadHash) {
    console.error("[paddle] idempotency payload hash mismatch — rejecting", {
      eventType: input.eventType,
      providerEventIdPrefix: input.providerEventId.slice(0, 12),
      priorStatus: row.status,
    });
    return { status: "unavailable" };
  }

  if (row?.status === "processed" || row?.status === "duplicate" || row?.status === "ignored") {
    await admin
      .from("paddle_webhook_events")
      .update({ status: "duplicate" } as never)
      .eq("provider", "paddle")
      .eq("provider_event_id", input.providerEventId);
    return { status: "duplicate" };
  }

  if (row?.status === "failed") {
    const { data: claimed, error: claimError } = await admin
      .from("paddle_webhook_events")
      .update({
        status: "processing",
        last_error: null,
        payload_hash: payloadHash,
      } as never)
      .eq("provider", "paddle")
      .eq("provider_event_id", input.providerEventId)
      .eq("status", "failed")
      .select("provider_event_id")
      .maybeSingle();

    if (claimError) {
      console.error("[paddle] idempotency failed→processing claim error:", claimError.message);
      return { status: "unavailable" };
    }
    if (!claimed) {
      return { status: "duplicate" };
    }
    return { status: "retry" };
  }

  if (row?.status === "processing") {
    const receivedAtMs = row.received_at ? Date.parse(row.received_at) : Number.NaN;
    const isStale =
      Number.isFinite(receivedAtMs) && Date.now() - receivedAtMs >= PROCESSING_STALE_MS;

    if (!isStale) {
      return { status: "duplicate" };
    }

    console.warn("[paddle] retrying stale processing webhook", {
      eventType: input.eventType,
      providerEventIdPrefix: input.providerEventId.slice(0, 12),
    });

    const { data: claimed, error: claimError } = await admin
      .from("paddle_webhook_events")
      .update({
        status: "processing",
        last_error: null,
        payload_hash: payloadHash,
        received_at: now,
      } as never)
      .eq("provider", "paddle")
      .eq("provider_event_id", input.providerEventId)
      .eq("status", "processing")
      .eq("received_at", row.received_at ?? "")
      .select("provider_event_id")
      .maybeSingle();

    if (claimError) {
      console.error("[paddle] idempotency stale processing claim error:", claimError.message);
      return { status: "unavailable" };
    }
    if (!claimed) {
      return { status: "duplicate" };
    }
    return { status: "retry" };
  }

  const { error: insertError } = await admin.from("paddle_webhook_events").insert({
    provider: "paddle",
    provider_event_id: input.providerEventId,
    event_type: input.eventType,
    occurred_at: input.occurredAt ?? null,
    received_at: now,
    status: "processing",
    payload_hash: payloadHash,
  } as never);

  if (insertError) {
    if (insertError.code === "23505") {
      return { status: "duplicate" };
    }
    console.error("[paddle] idempotency insert failed:", {
      message: insertError.message,
      eventType: input.eventType,
      providerEventIdPrefix: input.providerEventId.slice(0, 12),
    });
    return { status: "unavailable" };
  }

  return { status: "proceed" };
}

export async function markPaddleEventProcessed(
  providerEventId: string,
  organizationId?: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("paddle_webhook_events")
    .update({
      status: "processed",
      processed_at: now,
      organization_id: organizationId ?? null,
      last_error: null,
    } as never)
    .eq("provider", "paddle")
    .eq("provider_event_id", providerEventId);

  if (error) {
    console.error("[paddle] failed to mark event processed:", error.message);
  }
}

export async function markPaddleEventIgnored(providerEventId: string): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("paddle_webhook_events")
    .update({
      status: "ignored",
      processed_at: now,
      last_error: null,
    } as never)
    .eq("provider", "paddle")
    .eq("provider_event_id", providerEventId);

  if (error) {
    console.error("[paddle] failed to mark event ignored:", error.message);
  }
}

export async function markPaddleEventFailed(
  providerEventId: string,
  errorMessage: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("paddle_webhook_events")
    .update({
      status: "failed",
      last_error: errorMessage.slice(0, 500),
    } as never)
    .eq("provider", "paddle")
    .eq("provider_event_id", providerEventId);

  if (error) {
    console.error("[paddle] failed to mark event failed:", error.message);
  }
}

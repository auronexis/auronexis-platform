import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type PaddleIdempotencyStatus = "proceed" | "duplicate" | "retry";

export type PaddleIdempotencyResult = {
  status: PaddleIdempotencyStatus;
};

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
    .select("status")
    .eq("provider", "paddle")
    .eq("provider_event_id", input.providerEventId)
    .maybeSingle();

  if (readError) {
    console.error("[paddle] idempotency read failed:", readError.message);
    return { status: "proceed" };
  }

  const row = existing as { status: string } | null;

  if (row?.status === "processed" || row?.status === "duplicate" || row?.status === "ignored") {
    await admin
      .from("paddle_webhook_events")
      .update({ status: "duplicate" } as never)
      .eq("provider", "paddle")
      .eq("provider_event_id", input.providerEventId);
    return { status: "duplicate" };
  }

  if (row?.status === "failed") {
    await admin
      .from("paddle_webhook_events")
      .update({
        status: "processing",
        last_error: null,
        payload_hash: payloadHash,
      } as never)
      .eq("provider", "paddle")
      .eq("provider_event_id", input.providerEventId);
    return { status: "retry" };
  }

  if (row?.status === "processing") {
    return { status: "duplicate" };
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
    console.error("[paddle] idempotency insert failed:", insertError.message);
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

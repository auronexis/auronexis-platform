import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export type StripeIdempotencyStatus = "proceed" | "duplicate" | "retry";

export type StripeIdempotencyResult = {
  status: StripeIdempotencyStatus;
  retryCount: number;
};

type StripeWebhookEventRow = {
  stripe_event_id: string;
  event_type: string;
  status: string;
  retry_count: number;
};

export type StripeWebhookDiagnostics = {
  processedEvents: number;
  duplicatesPrevented: number;
  failedEvents: number;
  retryCount: number;
  lastWebhookReceivedAt: string | null;
  lastWebhookEventType: string | null;
  tableReachable: boolean;
};

/** Returns true when the Stripe event has already been processed successfully. */
export async function isStripeEventProcessed(stripeEventId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stripe_webhook_events")
    .select("status")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return (data as { status: string }).status === "processed";
}

/** Mark a Stripe webhook event as successfully processed. */
export async function markStripeEventProcessed(
  stripeEventId: string,
  eventType: string,
  organizationId?: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin.from("stripe_webhook_events").upsert(
    {
      stripe_event_id: stripeEventId,
      event_type: eventType,
      status: "processed",
      organization_id: organizationId ?? null,
      processed_at: now,
      last_attempt_at: now,
      error_message: null,
    } as never,
    { onConflict: "stripe_event_id" },
  );

  if (error) {
    console.error("[stripe] failed to mark event processed:", error.message);
  }
}

/** Mark a Stripe webhook event as failed (allows safe retries). */
export async function markStripeEventFailed(
  stripeEventId: string,
  eventType: string,
  errorMessage: string,
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("stripe_webhook_events")
    .select("retry_count")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();

  const retryCount = ((existing as { retry_count?: number } | null)?.retry_count ?? 0) + 1;

  const { error } = await admin.from("stripe_webhook_events").upsert(
    {
      stripe_event_id: stripeEventId,
      event_type: eventType,
      status: "failed",
      retry_count: retryCount,
      error_message: errorMessage.slice(0, 500),
      last_attempt_at: now,
    } as never,
    { onConflict: "stripe_event_id" },
  );

  if (error) {
    console.error("[stripe] failed to mark event failed:", error.message);
  }
}

/**
 * Claim idempotency for a Stripe webhook event.
 * Duplicate deliveries of successfully processed events are ignored.
 * Failed events may be retried by Stripe.
 */
export async function ensureStripeIdempotency(
  event: Stripe.Event,
): Promise<StripeIdempotencyResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing, error: readError } = await admin
    .from("stripe_webhook_events")
    .select("stripe_event_id, event_type, status, retry_count")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (readError) {
    console.error("[stripe] idempotency read failed:", readError.message);
    return { status: "proceed", retryCount: 0 };
  }

  const row = existing as StripeWebhookEventRow | null;

  if (row?.status === "processed" || row?.status === "duplicate") {
    await admin
      .from("stripe_webhook_events")
      .update({ status: "duplicate", last_attempt_at: now } as never)
      .eq("stripe_event_id", event.id);
    return { status: "duplicate", retryCount: row.retry_count ?? 0 };
  }

  if (row?.status === "failed") {
    await admin
      .from("stripe_webhook_events")
      .update({
        status: "processing",
        retry_count: (row.retry_count ?? 0) + 1,
        last_attempt_at: now,
        error_message: null,
      } as never)
      .eq("stripe_event_id", event.id);
    return { status: "retry", retryCount: (row.retry_count ?? 0) + 1 };
  }

  if (row?.status === "processing") {
    return { status: "duplicate", retryCount: row.retry_count ?? 0 };
  }

  const { error: insertError } = await admin.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    status: "processing",
    retry_count: 0,
    received_at: now,
    last_attempt_at: now,
  } as never);

  if (insertError) {
    if (insertError.code === "23505") {
      return { status: "duplicate", retryCount: 0 };
    }
    console.error("[stripe] idempotency insert failed:", insertError.message);
  }

  return { status: "proceed", retryCount: 0 };
}

/** Aggregate Stripe webhook metrics for diagnostics (no secret values). */
export async function getStripeWebhookDiagnostics(): Promise<StripeWebhookDiagnostics> {
  const admin = createAdminClient();

  const tableProbe = await admin.from("stripe_webhook_events").select("id", { count: "exact", head: true });
  if (tableProbe.error) {
    return {
      processedEvents: 0,
      duplicatesPrevented: 0,
      failedEvents: 0,
      retryCount: 0,
      lastWebhookReceivedAt: null,
      lastWebhookEventType: null,
      tableReachable: false,
    };
  }

  const [processed, duplicates, failed, lastRow] = await Promise.all([
    admin
      .from("stripe_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "processed"),
    admin
      .from("stripe_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "duplicate"),
    admin
      .from("stripe_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    admin
      .from("stripe_webhook_events")
      .select("received_at, event_type, retry_count")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const retrySum = await admin.from("stripe_webhook_events").select("retry_count");
  const retryCount = ((retrySum.data ?? []) as Array<{ retry_count: number }>).reduce(
    (sum, row) => sum + (row.retry_count ?? 0),
    0,
  );

  const last = lastRow.data as { received_at: string; event_type: string } | null;

  return {
    processedEvents: processed.count ?? 0,
    duplicatesPrevented: duplicates.count ?? 0,
    failedEvents: failed.count ?? 0,
    retryCount,
    lastWebhookReceivedAt: last?.received_at ?? null,
    lastWebhookEventType: last?.event_type ?? null,
    tableReachable: true,
  };
}

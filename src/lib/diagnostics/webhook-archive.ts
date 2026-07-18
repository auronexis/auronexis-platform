import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Read-only diagnostics for the legacy `stripe_webhook_events` archive table.
 * Stripe webhook ingestion has been removed — this only reads historical rows
 * that were recorded before the Paddle migration. Never calls the Stripe API.
 */
export type StripeWebhookDiagnostics = {
  processedEvents: number;
  duplicatesPrevented: number;
  failedEvents: number;
  retryCount: number;
  lastWebhookReceivedAt: string | null;
  lastWebhookEventType: string | null;
  tableReachable: boolean;
};

/** Aggregate legacy Stripe webhook metrics for diagnostics (no secret values). */
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

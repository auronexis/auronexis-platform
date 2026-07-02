import "server-only";

import { listDueWebhookDeliveries } from "@/lib/webhooks/queries";
import { retryWebhookDelivery } from "@/lib/webhooks/deliveries";

/** Retry pending/retrying webhook deliveries — safe for cron. */
export async function processWebhookDeliveryRetries(): Promise<Record<string, unknown>> {
  const due = await listDueWebhookDeliveries(25);
  let processed = 0;
  let failed = 0;

  for (const item of due) {
    try {
      await retryWebhookDelivery(item.delivery, item.endpoint);
      processed += 1;
    } catch {
      failed += 1;
    }
  }

  return { processed, failed, queued: due.length };
}

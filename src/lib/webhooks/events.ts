import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueWebhookDelivery } from "@/lib/webhooks/deliveries";
import { WEBHOOK_EVENTS, type WebhookEventType } from "@/lib/webhooks/types";
import type { WebhookEndpoint } from "@/types/database";

const ALLOWED_EVENTS = new Set<string>(WEBHOOK_EVENTS);

/** Dispatch an outbound webhook to all active matching endpoints — never throws. */
export async function dispatchWebhookEvent(input: {
  organizationId: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
}): Promise<void> {
  if (!ALLOWED_EVENTS.has(input.eventType)) {
    return;
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("webhook_endpoints")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("active", true);

    const endpoints = (data ?? []) as WebhookEndpoint[];
    const matching = endpoints.filter((endpoint) => endpoint.events.includes(input.eventType));

    await Promise.all(
      matching.map((endpoint) =>
        enqueueWebhookDelivery({
          organizationId: input.organizationId,
          endpoint,
          eventType: input.eventType,
          payload: input.payload,
        }),
      ),
    );
  } catch (error) {
    console.warn("[webhooks] dispatch failed:", error);
  }
}

/** Backward-compatible alias used by legacy API webhook callers. */
export const dispatchApiWebhook = dispatchWebhookEvent;

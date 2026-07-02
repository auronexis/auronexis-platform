import "server-only";

import { executeHttpRequest } from "@/lib/integrations/execution/http-client";
import { decryptSecretValue } from "@/lib/integrations/secrets/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  markEndpointDeliveryResult,
  recordWebhookDeliveryActivity,
} from "@/lib/webhooks/actions";
import { buildWebhookSignatureHeaders } from "@/lib/webhooks/signing";
import type { WebhookEventType } from "@/lib/webhooks/types";
import type { WebhookDelivery, WebhookEndpoint } from "@/types/database";

const MAX_ATTEMPTS = 5;

function buildDeliveryBody(delivery: WebhookDelivery): string {
  return JSON.stringify({
    id: delivery.id,
    type: delivery.event_type,
    createdAt: delivery.created_at,
    data: delivery.payload,
  });
}

export async function deliverWebhook(
  delivery: WebhookDelivery,
  endpoint: WebhookEndpoint,
): Promise<void> {
  const admin = createAdminClient();
  const secret = decryptSecretValue(endpoint.secret);
  const body = buildDeliveryBody(delivery);
  const { headers } = buildWebhookSignatureHeaders({
    secret,
    payload: body,
    eventType: delivery.event_type,
    deliveryId: delivery.id,
  });

  try {
    const response = await executeHttpRequest({
      method: "POST",
      url: endpoint.url,
      headers,
      body,
      timeoutMs: 15_000,
      maxAttempts: 1,
    });

    const responseBody = response.bodyText ? response.bodyText.slice(0, 2000) : null;

    const succeeded = response.ok;
    const attempts = delivery.attempts + 1;

    await admin
      .from("webhook_deliveries")
      .update({
        status: succeeded ? "delivered" : attempts >= MAX_ATTEMPTS ? "failed" : "retrying",
        attempts,
        response_status: response.status,
        response_body: responseBody,
        delivered_at: succeeded ? new Date().toISOString() : null,
        next_retry_at: succeeded
          ? null
          : new Date(Date.now() + attempts * 60_000).toISOString(),
      } as never)
      .eq("id", delivery.id);

    await markEndpointDeliveryResult({ endpointId: endpoint.id, succeeded });
    await recordWebhookDeliveryActivity({
      organizationId: delivery.organization_id,
      endpointId: endpoint.id,
      deliveryId: delivery.id,
      eventType: delivery.event_type,
      succeeded,
    });
  } catch (error) {
    const attempts = delivery.attempts + 1;
    const message = error instanceof Error ? error.message : "Delivery failed";

    await admin
      .from("webhook_deliveries")
      .update({
        status: attempts >= MAX_ATTEMPTS ? "failed" : "retrying",
        attempts,
        response_body: message.slice(0, 2000),
        next_retry_at: new Date(Date.now() + attempts * 60_000).toISOString(),
      } as never)
      .eq("id", delivery.id);

    await markEndpointDeliveryResult({ endpointId: endpoint.id, succeeded: false });
    await recordWebhookDeliveryActivity({
      organizationId: delivery.organization_id,
      endpointId: endpoint.id,
      deliveryId: delivery.id,
      eventType: delivery.event_type,
      succeeded: false,
    });
  }
}

export async function enqueueWebhookDelivery(input: {
  organizationId: string;
  endpoint: WebhookEndpoint;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("webhook_deliveries")
    .insert({
      organization_id: input.organizationId,
      endpoint_id: input.endpoint.id,
      event_type: input.eventType,
      payload: input.payload,
      status: "pending",
      attempts: 0,
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    return;
  }

  await deliverWebhook(data as WebhookDelivery, input.endpoint);
}

export async function retryWebhookDelivery(
  delivery: WebhookDelivery,
  endpoint: WebhookEndpoint,
): Promise<void> {
  await deliverWebhook(delivery, endpoint);
}

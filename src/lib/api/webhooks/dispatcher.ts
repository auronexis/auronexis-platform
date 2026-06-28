import "server-only";

import { executeHttpRequest } from "@/lib/integrations/execution/http-client";
import { decryptSecretValue, encryptSecretValue } from "@/lib/integrations/secrets/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWebhookSignatureHeader, generateWebhookSigningSecret } from "@/lib/api/webhooks/signing";
import type { ApiWebhookEvent } from "@/lib/api/types";
import type { ApiWebhookDelivery, ApiWebhookEndpoint } from "@/types/database";

const MAX_ATTEMPTS = 5;

export function encryptWebhookSigningSecret(secret: string): string {
  return encryptSecretValue(secret);
}

export async function createWebhookEndpoint(input: {
  organizationId: string;
  url: string;
  description?: string;
  events: string[];
  createdBy: string;
}): Promise<{ endpoint: ApiWebhookEndpoint; signingSecret: string }> {
  const signingSecret = generateWebhookSigningSecret();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("api_webhook_endpoints")
    .insert({
      organization_id: input.organizationId,
      url: input.url,
      description: input.description ?? null,
      events: input.events,
      signing_secret_encrypted: encryptWebhookSigningSecret(signingSecret),
      status: "active",
      created_by: input.createdBy,
      updated_by: input.createdBy,
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create webhook endpoint.");
  }

  return { endpoint: data as ApiWebhookEndpoint, signingSecret };
}

export async function dispatchApiWebhook(input: {
  organizationId: string;
  eventType: ApiWebhookEvent;
  payload: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("api_webhook_endpoints")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("status", "active");

  const endpoints = (data ?? []) as ApiWebhookEndpoint[];
  const matching = endpoints.filter((endpoint) => endpoint.events.includes(input.eventType));

  await Promise.all(
    matching.map((endpoint) =>
      enqueueDelivery({
        organizationId: input.organizationId,
        endpoint,
        eventType: input.eventType,
        payload: input.payload,
      }),
    ),
  );
}

async function enqueueDelivery(input: {
  organizationId: string;
  endpoint: ApiWebhookEndpoint;
  eventType: ApiWebhookEvent;
  payload: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("api_webhook_deliveries")
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

  await deliverWebhookAttempt(data as ApiWebhookDelivery, input.endpoint);
}

async function deliverWebhookAttempt(
  delivery: ApiWebhookDelivery,
  endpoint: ApiWebhookEndpoint,
): Promise<void> {
  const admin = createAdminClient();
  const secret = decryptSecretValue(endpoint.signing_secret_encrypted);
  const body = JSON.stringify({
    id: delivery.id,
    type: delivery.event_type,
    createdAt: delivery.created_at,
    data: delivery.payload,
  });
  const { timestamp, signature } = buildWebhookSignatureHeader(secret, body);

  try {
    const response = await executeHttpRequest({
      method: "POST",
      url: endpoint.url,
      headers: {
        "Content-Type": "application/json",
        "X-Auroranexis-Signature": signature,
        "X-Auroranexis-Timestamp": timestamp,
        "X-Auroranexis-Event": delivery.event_type,
      },
      body,
      timeoutMs: 15_000,
      maxAttempts: 1,
    });

    const status = response.ok ? "delivered" : "failed";
    await admin
      .from("api_webhook_deliveries")
      .update({
        status,
        attempts: delivery.attempts + 1,
        response_status: response.status,
        delivered_at: response.ok ? new Date().toISOString() : null,
        error_message: response.ok ? null : `HTTP ${response.status}`,
      } as never)
      .eq("id", delivery.id);
  } catch (error) {
    const attempts = delivery.attempts + 1;
    const message = error instanceof Error ? error.message : "Delivery failed";
    await admin
      .from("api_webhook_deliveries")
      .update({
        status: attempts >= MAX_ATTEMPTS ? "dead_letter" : "retrying",
        attempts,
        error_message: message,
        next_retry_at: new Date(Date.now() + attempts * 60_000).toISOString(),
      } as never)
      .eq("id", delivery.id);
  }
}

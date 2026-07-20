import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import { encryptSecretValue } from "@/lib/integrations/secrets/encryption";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import { WEBHOOK_EVENTS, type CreateWebhookEndpointResult, type WebhookEndpointView } from "@/lib/webhooks/types";
import { assertSafeOutboundUrl } from "@/lib/security/outbound-url";
import { generateWebhookSigningSecret } from "@/lib/webhooks/signing";
import type { WebhookEndpoint } from "@/types/database";

function mapEndpoint(row: WebhookEndpoint): WebhookEndpointView {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    url: row.url,
    events: row.events ?? [],
    active: row.active,
    lastSuccessAt: row.last_success_at,
    lastFailureAt: row.last_failure_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateEvents(events: string[]): string[] {
  const allowed = new Set<string>(WEBHOOK_EVENTS);
  const unique = Array.from(new Set(events.filter((event) => allowed.has(event))));
  if (unique.length === 0) {
    throw new Error("Select at least one webhook event.");
  }
  return unique;
}

export async function createWebhookEndpointAction(input: {
  session: SessionContext;
  name: string;
  url: string;
  events: string[];
}): Promise<CreateWebhookEndpointResult> {
  const safeUrl = assertSafeOutboundUrl(input.url);
  const signingSecret = generateWebhookSigningSecret();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webhook_endpoints")
    .insert({
      organization_id: input.session.organization.id,
      name: input.name.trim(),
      url: safeUrl,
      secret: encryptSecretValue(signingSecret),
      events: validateEvents(input.events),
      active: true,
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create webhook endpoint.");
  }

  const endpoint = mapEndpoint(data as WebhookEndpoint);

  await recordActivityEvent({
    organizationId: input.session.organization.id,
    actorUserId: input.session.user.id,
    entityType: "organization",
    entityId: input.session.organization.id,
    eventType: "webhook.endpoint_created",
    action: "webhook_endpoint_created",
    title: `Webhook endpoint created: ${endpoint.name}`,
    metadata: { endpointId: endpoint.id, url: endpoint.url },
  }).catch(() => undefined);

  return { endpoint, signingSecret };
}

export async function disableWebhookEndpointAction(
  session: SessionContext,
  endpointId: string,
): Promise<WebhookEndpointView> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webhook_endpoints")
    .update({ active: false } as never)
    .eq("organization_id", session.organization.id)
    .eq("id", endpointId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Webhook endpoint not found.");
  }

  const endpoint = mapEndpoint(data as WebhookEndpoint);

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    eventType: "webhook.endpoint_disabled",
    action: "webhook_endpoint_disabled",
    title: `Webhook endpoint disabled: ${endpoint.name}`,
    metadata: { endpointId: endpoint.id },
  }).catch(() => undefined);

  return endpoint;
}

export async function recordWebhookDeliveryActivity(input: {
  organizationId: string;
  endpointId: string;
  deliveryId: string;
  eventType: string;
  succeeded: boolean;
}): Promise<void> {
  await recordActivityEvent({
    organizationId: input.organizationId,
    entityType: "organization",
    entityId: input.organizationId,
    eventType: input.succeeded ? "webhook.delivery_succeeded" : "webhook.delivery_failed",
    action: input.succeeded ? "webhook_delivery_succeeded" : "webhook_delivery_failed",
    title: input.succeeded
      ? `Webhook delivered: ${input.eventType}`
      : `Webhook delivery failed: ${input.eventType}`,
    metadata: {
      endpointId: input.endpointId,
      deliveryId: input.deliveryId,
      eventType: input.eventType,
    },
  }).catch(() => undefined);
}

export async function markEndpointDeliveryResult(input: {
  endpointId: string;
  succeeded: boolean;
}): Promise<void> {
  const admin = createAdminClient();
  const timestamp = new Date().toISOString();
  await admin
    .from("webhook_endpoints")
    .update(
      (input.succeeded
        ? { last_success_at: timestamp }
        : { last_failure_at: timestamp }) as never,
    )
    .eq("id", input.endpointId);
}

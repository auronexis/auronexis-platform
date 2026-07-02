import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { WebhookDeliveryView, WebhookEndpointView } from "@/lib/webhooks/types";
import type { WebhookDelivery, WebhookEndpoint } from "@/types/database";

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

function mapDelivery(row: WebhookDelivery): WebhookDeliveryView {
  return {
    id: row.id,
    endpointId: row.endpoint_id,
    eventType: row.event_type,
    status: row.status,
    attempts: row.attempts,
    responseStatus: row.response_status,
    responseBody: row.response_body,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
  };
}

export async function listWebhookEndpoints(session: SessionContext): Promise<WebhookEndpointView[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .select("*")
      .eq("organization_id", session.organization.id)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return ((data ?? []) as WebhookEndpoint[]).map(mapEndpoint);
  } catch {
    return [];
  }
}

export async function listRecentWebhookDeliveries(
  session: SessionContext,
  limit = 20,
): Promise<WebhookDeliveryView[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("webhook_deliveries")
      .select("*")
      .eq("organization_id", session.organization.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return ((data ?? []) as WebhookDelivery[]).map(mapDelivery);
  } catch {
    return [];
  }
}

export async function getWebhookEndpointById(
  organizationId: string,
  endpointId: string,
): Promise<WebhookEndpoint | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("webhook_endpoints")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", endpointId)
    .maybeSingle();

  return (data as WebhookEndpoint | null) ?? null;
}

export async function listDueWebhookDeliveries(limit = 25): Promise<
  Array<{ delivery: WebhookDelivery; endpoint: WebhookEndpoint }>
> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: deliveries } = await admin
    .from("webhook_deliveries")
    .select("*")
    .in("status", ["pending", "retrying"])
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order("created_at", { ascending: true })
    .limit(limit);

  const deliveryRows = (deliveries ?? []) as WebhookDelivery[];
  if (deliveryRows.length === 0) {
    return [];
  }

  const endpointIds = Array.from(new Set(deliveryRows.map((row) => row.endpoint_id)));
  const { data: endpoints } = await admin
    .from("webhook_endpoints")
    .select("*")
    .in("id", endpointIds)
    .eq("active", true);

  const endpointMap = new Map(
    ((endpoints ?? []) as WebhookEndpoint[]).map((endpoint) => [endpoint.id, endpoint]),
  );

  return deliveryRows
    .map((delivery) => {
      const endpoint = endpointMap.get(delivery.endpoint_id);
      return endpoint ? { delivery, endpoint } : null;
    })
    .filter((item): item is { delivery: WebhookDelivery; endpoint: WebhookEndpoint } => item != null);
}

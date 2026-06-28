import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ApiDashboardSnapshot, ApiDiagnosticsSnapshot, ApiWebhookDeliveryView, ApiWebhookEndpointView } from "@/lib/api/types";
import { OPENAPI_VERSION } from "@/lib/api/types";
import { API_VERSION } from "@/lib/api/versioning/constants";
import { listApiKeys } from "@/lib/api/keys/repository";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ApiRequestLog, ApiWebhookDelivery, ApiWebhookEndpoint } from "@/types/database";

function startOfTodayIso(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function getApiDashboardSnapshot(session: SessionContext): Promise<ApiDashboardSnapshot> {
  const supabase = await createClient();
  const keys = await listApiKeys(session);
  const today = startOfTodayIso();

  const [{ data: logs }, { data: endpoints }, { data: deliveries }] = await Promise.all([
    supabase
      .from("api_request_logs")
      .select("*")
      .eq("organization_id", session.organization.id)
      .gte("created_at", today),
    supabase.from("api_webhook_endpoints").select("*").eq("organization_id", session.organization.id),
    supabase
      .from("api_webhook_deliveries")
      .select("*")
      .eq("organization_id", session.organization.id)
      .gte("created_at", today)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const requestLogs = (logs ?? []) as ApiRequestLog[];
  const latencyValues = requestLogs.map((log) => log.duration_ms);
  const averageLatencyMs =
    latencyValues.length > 0
      ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
      : null;

  const endpointRows = (endpoints ?? []) as ApiWebhookEndpoint[];
  const deliveryRows = (deliveries ?? []) as ApiWebhookDelivery[];

  return {
    activeKeyCount: keys.filter((key) => key.status === "active").length,
    revokedKeyCount: keys.filter((key) => key.status === "revoked").length,
    requestsToday: requestLogs.length,
    rateLimitedToday: requestLogs.filter((log) => log.rate_limited).length,
    failedRequestsToday: requestLogs.filter((log) => log.status_code >= 400).length,
    averageLatencyMs,
    webhookEndpointCount: endpointRows.length,
    webhookDeliveriesToday: deliveryRows.length,
    keys,
    webhookEndpoints: endpointRows.map(mapEndpoint),
    recentDeliveries: deliveryRows.map(mapDelivery),
  };
}

export async function getApiDiagnosticsSnapshot(
  session: SessionContext,
): Promise<ApiDiagnosticsSnapshot> {
  const admin = createAdminClient();
  const today = startOfTodayIso();

  const [{ count: keyCount, error: keyError }, { data: logs, error: logError }, { count: deliveryCount }] =
    await Promise.all([
      admin
        .from("api_keys")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", session.organization.id)
        .eq("status", "active"),
      admin
        .from("api_request_logs")
        .select("*")
        .eq("organization_id", session.organization.id)
        .gte("created_at", today),
      admin
        .from("api_webhook_deliveries")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", session.organization.id)
        .gte("created_at", today),
    ]);

  const requestLogs = (logs ?? []) as ApiRequestLog[];
  const latencyValues = requestLogs.map((log) => log.duration_ms);

  return {
    openApiVersion: OPENAPI_VERSION,
    apiVersion: API_VERSION,
    requestsToday: requestLogs.length,
    averageLatencyMs:
      latencyValues.length > 0
        ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
        : null,
    failedRequestsToday: requestLogs.filter((log) => log.status_code >= 400).length,
    rateLimitedToday: requestLogs.filter((log) => log.rate_limited).length,
    webhookDeliveriesToday: deliveryCount ?? 0,
    activeApiKeys: keyCount ?? 0,
    tableReachable: !keyError && !logError,
  };
}

function mapEndpoint(row: ApiWebhookEndpoint): ApiWebhookEndpointView {
  return {
    id: row.id,
    organizationId: row.organization_id,
    url: row.url,
    description: row.description,
    events: row.events ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDelivery(row: ApiWebhookDelivery): ApiWebhookDeliveryView {
  return {
    id: row.id,
    endpointId: row.endpoint_id,
    eventType: row.event_type,
    status: row.status,
    attempts: row.attempts,
    responseStatus: row.response_status,
    errorMessage: row.error_message,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
  };
}

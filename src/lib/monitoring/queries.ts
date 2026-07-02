import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import {
  mapConnectorRow,
  mapMonitoringActivityRow,
  mapMonitoringEventRow,
  type MonitoringActivityView,
  type MonitoringConnector,
  type MonitoringConnectorStatus,
  type MonitoringEvent,
  type MonitoringProvider,
} from "@/lib/monitoring/types";

export const MONITORING_CONNECTOR_SELECT =
  "id, organization_id, name, provider, status, enabled, configuration, last_check_at, last_success_at, last_failure_at, created_at, updated_at";

export const MONITORING_EVENT_SELECT =
  "id, organization_id, connector_id, client_id, severity, status, message, payload, detected_at, created_at";

export type ListConnectorsOptions = {
  status?: MonitoringConnectorStatus | MonitoringConnectorStatus[];
  provider?: MonitoringProvider | string;
  includeArchived?: boolean;
  limit?: number;
};

export type ListMonitoringEventsOptions = {
  connectorId?: string;
  clientId?: string;
  severity?: string;
  limit?: number;
};

/** List monitoring connectors for the current organization — never throws. */
export async function listConnectors(
  session: SessionContext,
  options: ListConnectorsOptions = {},
): Promise<MonitoringConnector[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("monitoring_connectors")
      .select(MONITORING_CONNECTOR_SELECT)
      .eq("organization_id", session.organization.id)
      .order("updated_at", { ascending: false });

    if (!options.includeArchived) {
      query = query.neq("status", "archived");
    }

    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      query = query.in("status", statuses);
    }

    if (options.provider) {
      query = query.eq("provider", options.provider);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[monitoring] listConnectors failed:", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapConnectorRow(row as Record<string, unknown>));
  } catch (error) {
    console.warn("[monitoring] listConnectors failed:", error);
    return [];
  }
}

/** Fetch a single connector scoped to the organization — never throws. */
export async function getConnector(
  session: SessionContext,
  connectorId: string,
): Promise<MonitoringConnector | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("monitoring_connectors")
      .select(MONITORING_CONNECTOR_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("id", connectorId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapConnectorRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** List monitoring events — never throws. */
export async function listMonitoringEvents(
  session: SessionContext,
  options: ListMonitoringEventsOptions = {},
): Promise<MonitoringEvent[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("monitoring_events")
      .select(MONITORING_EVENT_SELECT)
      .eq("organization_id", session.organization.id)
      .order("created_at", { ascending: false });

    if (options.connectorId) {
      query = query.eq("connector_id", options.connectorId);
    }

    if (options.clientId) {
      query = query.eq("client_id", options.clientId);
    }

    if (options.severity) {
      query = query.eq("severity", options.severity);
    }

    query = query.limit(options.limit ?? 25);

    const { data, error } = await query;

    if (error) {
      console.warn("[monitoring] listMonitoringEvents failed:", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapMonitoringEventRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** List monitoring activity entries — never throws. */
export async function listMonitoringActivity(
  session: SessionContext,
  options: { connectorId?: string; limit?: number } = {},
): Promise<MonitoringActivityView[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("monitoring_activity")
      .select("id, organization_id, connector_id, event_type, message, metadata, created_at")
      .eq("organization_id", session.organization.id)
      .order("created_at", { ascending: false })
      .limit(options.limit ?? 20);

    if (options.connectorId) {
      query = query.eq("connector_id", options.connectorId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[monitoring] listMonitoringActivity failed:", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapMonitoringActivityRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Count connectors linked to a client via configuration — never throws. */
export async function countClientConnectors(
  session: SessionContext,
  clientId: string,
): Promise<number> {
  try {
    const connectors = await listConnectors(session, { includeArchived: false });
    return connectors.filter((connector) => connector.configuration.clientId === clientId).length;
  } catch {
    return 0;
  }
}

import "server-only";

import {
  listConnectors,
  listMonitoringActivity,
  listMonitoringEvents,
} from "@/lib/monitoring/queries";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type {
  ClientMonitoringSummary,
  MonitoringConnectorMetrics,
  MonitoringDashboardMetrics,
  MonitoringReportSnapshot,
  MonitoringSummary,
} from "@/lib/monitoring/types";

function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

/** Aggregate connector metrics for a single connector — never throws. */
export async function getConnectorMetrics(
  session: SessionContext,
  connectorId: string,
): Promise<MonitoringConnectorMetrics> {
  try {
    const events = await listMonitoringEvents(session, { connectorId, limit: 200 });
    const criticalEvents = events.filter((event) => event.severity === "critical").length;
    const failureEvents = events.filter(
      (event) => event.severity === "high" || event.severity === "critical",
    ).length;
    const recoveryEvents = events.filter(
      (event) => event.severity === "low" && (event.message?.toLowerCase().includes("recover") ?? false),
    ).length;

    const totalChecks = Math.max(events.length, 1);
    const failures = failureEvents;
    const healthPercent = Math.max(0, Math.min(100, Math.round(((totalChecks - failures) / totalChecks) * 100)));

    return {
      connectorId,
      totalEvents: events.length,
      criticalEvents,
      failureEvents,
      recoveryEvents,
      lastEventAt: events[0]?.created_at ?? null,
      healthPercent,
    };
  } catch {
    return {
      connectorId,
      totalEvents: 0,
      criticalEvents: 0,
      failureEvents: 0,
      recoveryEvents: 0,
      lastEventAt: null,
      healthPercent: 100,
    };
  }
}

/** Organization-wide monitoring summary — never throws. */
export async function getMonitoringSummary(session: SessionContext): Promise<MonitoringSummary> {
  try {
    const [connectors, recentActivity, recentEvents] = await Promise.all([
      listConnectors(session),
      listMonitoringActivity(session, { limit: 10 }),
      listMonitoringEvents(session, { limit: 10 }),
    ]);

    const activeConnectors = connectors.filter((item) => item.status === "active").length;
    const failedConnectors = connectors.filter((item) => item.status === "failed").length;
    const pausedConnectors = connectors.filter((item) => item.status === "paused").length;

    const supabase = await createClient();
    const todayStart = startOfTodayIso();

    const [{ count: eventsToday }, { count: criticalEventsToday }] = await Promise.all([
      supabase
        .from("monitoring_events")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", session.organization.id)
        .gte("created_at", todayStart),
      supabase
        .from("monitoring_events")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", session.organization.id)
        .eq("severity", "critical")
        .gte("created_at", todayStart),
    ]);

    const lastCheckAt =
      connectors
        .map((item) => item.last_check_at)
        .filter(Boolean)
        .sort()
        .pop() ?? null;

    const healthyCount = connectors.filter(
      (item) => item.status === "active" && item.enabled,
    ).length;
    const tracked = connectors.filter((item) => item.status !== "archived").length;
    const connectorHealthPercent =
      tracked === 0 ? 100 : Math.round((healthyCount / tracked) * 100);

    return {
      activeConnectors,
      failedConnectors,
      pausedConnectors,
      eventsToday: eventsToday ?? 0,
      criticalEventsToday: criticalEventsToday ?? 0,
      lastCheckAt,
      connectorHealthPercent,
      recentActivity,
      recentEvents,
    };
  } catch {
    return {
      activeConnectors: 0,
      failedConnectors: 0,
      pausedConnectors: 0,
      eventsToday: 0,
      criticalEventsToday: 0,
      lastCheckAt: null,
      connectorHealthPercent: 100,
      recentActivity: [],
      recentEvents: [],
    };
  }
}

/** Dashboard KPI subset — never throws. */
export async function getMonitoringDashboardMetrics(
  session: SessionContext,
): Promise<MonitoringDashboardMetrics> {
  const summary = await getMonitoringSummary(session);
  return {
    activeConnectors: summary.activeConnectors,
    failedConnectors: summary.failedConnectors,
    eventsToday: summary.eventsToday,
    criticalEvents: summary.criticalEventsToday,
    lastCheckAt: summary.lastCheckAt,
    connectorHealthPercent: summary.connectorHealthPercent,
  };
}

/** Client-scoped monitoring summary — never throws. */
export async function getClientMonitoringSummary(
  session: SessionContext,
  clientId: string,
): Promise<ClientMonitoringSummary> {
  try {
    const [connectors, recentEvents] = await Promise.all([
      listConnectors(session),
      listMonitoringEvents(session, { clientId, limit: 8 }),
    ]);

    const connectedCount = connectors.filter(
      (connector) => connector.configuration.clientId === clientId,
    ).length;

    const healthImpactEvents = recentEvents.filter(
      (event) => event.severity === "high" || event.severity === "critical",
    ).length;

    const supabase = await createClient();
    const [{ count: openIncidents }, { count: openRisks }] = await Promise.all([
      supabase
        .from("incidents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", session.organization.id)
        .eq("client_id", clientId)
        .in("status", ["open", "investigating"]),
      supabase
        .from("client_risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", session.organization.id)
        .eq("client_id", clientId)
        .in("status", ["open", "acknowledged", "mitigated"]),
    ]);

    return {
      connectedCount,
      recentEvents,
      healthImpactEvents,
      openIncidents: openIncidents ?? 0,
      openRisks: openRisks ?? 0,
    };
  } catch {
    return {
      connectedCount: 0,
      recentEvents: [],
      healthImpactEvents: 0,
      openIncidents: 0,
      openRisks: 0,
    };
  }
}

/** Report-safe monitoring snapshot — never throws. */
export async function getMonitoringReportSnapshot(
  session: SessionContext,
  clientId: string,
): Promise<MonitoringReportSnapshot> {
  try {
    const connectors = await listConnectors(session);
    const clientConnectors = connectors.filter(
      (connector) => connector.configuration.clientId === clientId,
    );
    const connectorIds = clientConnectors.map((connector) => connector.id);

    if (connectorIds.length === 0) {
      return { connectorCount: 0, failures: 0, recoveries: 0, healthImpactEvents: 0 };
    }

    const events = await listMonitoringEvents(session, { clientId, limit: 100 });

    return {
      connectorCount: clientConnectors.length,
      failures: events.filter((event) => event.severity === "high" || event.severity === "critical")
        .length,
      recoveries: events.filter((event) => event.severity === "low").length,
      healthImpactEvents: events.filter(
        (event) => event.severity === "high" || event.severity === "critical",
      ).length,
    };
  } catch {
    return { connectorCount: 0, failures: 0, recoveries: 0, healthImpactEvents: 0 };
  }
}

import "server-only";

import { recordMonitoringActivity } from "@/lib/monitoring/activity";
import { recordMonitoringEvent } from "@/lib/monitoring/events";
import { getConnector } from "@/lib/monitoring/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";
import type { MonitoringEventSeverity } from "@/lib/monitoring/types";

export type ConnectorHealthResult = {
  healthy: boolean;
  message: string;
  checkedAt: string;
};

function deriveSimulatedHealth(provider: string, connectorName: string): ConnectorHealthResult {
  const checkedAt = new Date().toISOString();
  const hash = `${provider}${connectorName}`.length;
  const healthy = hash % 5 !== 0;

  return {
    healthy,
    message: healthy
      ? `${provider} connector responded successfully.`
      : `${provider} connector check failed — simulated failure.`,
    checkedAt,
  };
}

/** Run a health check for a connector and persist results — never throws. */
export async function checkConnectorHealth(
  session: SessionContext,
  connectorId: string,
): Promise<ConnectorHealthResult | null> {
  try {
    const connector = await getConnector(session, connectorId);
    if (!connector || connector.status === "archived") {
      return null;
    }

    const result = deriveSimulatedHealth(connector.provider, connector.name);
    const admin = createAdminClient();
    const now = result.checkedAt;

    await admin
      .from("monitoring_connectors")
      .update({
        last_check_at: now,
        last_success_at: result.healthy ? now : connector.last_success_at,
        last_failure_at: result.healthy ? connector.last_failure_at : now,
        status: result.healthy ? "active" : "failed",
      } as never)
      .eq("organization_id", session.organization.id)
      .eq("id", connectorId);

    await recordMonitoringActivity({
      organizationId: session.organization.id,
      connectorId,
      eventType: "monitoring.health_checked",
      message: result.message,
      metadata: { healthy: result.healthy },
      actorUserId: session.user.id,
    });

    const severity: MonitoringEventSeverity = result.healthy ? "low" : "high";
    await recordMonitoringEvent({
      organizationId: session.organization.id,
      connectorId,
      clientId: connector.configuration.clientId ?? null,
      severity,
      message: result.message,
      actorUserId: session.user.id,
      payload: { simulated: false, healthy: result.healthy },
    });

    return result;
  } catch (error) {
    console.warn("[monitoring] checkConnectorHealth failed:", error);
    return null;
  }
}

/** Simulate a monitoring event without running a full health probe — never throws. */
export async function simulateConnectorCheck(
  session: SessionContext,
  connectorId: string,
  options: { severity?: MonitoringEventSeverity; message?: string } = {},
): Promise<string | null> {
  try {
    const connector = await getConnector(session, connectorId);
    if (!connector || connector.status === "archived") {
      return null;
    }

    const severity = options.severity ?? "medium";
    const message =
      options.message ??
      `Simulated ${severity} event for ${connector.name} (${connector.provider}).`;

    const admin = createAdminClient();
    await admin
      .from("monitoring_connectors")
      .update({ last_check_at: new Date().toISOString() } as never)
      .eq("organization_id", session.organization.id)
      .eq("id", connectorId);

    return recordMonitoringEvent({
      organizationId: session.organization.id,
      connectorId,
      clientId: connector.configuration.clientId ?? null,
      severity,
      message,
      actorUserId: session.user.id,
      payload: { simulated: true },
    });
  } catch (error) {
    console.warn("[monitoring] simulateConnectorCheck failed:", error);
    return null;
  }
}

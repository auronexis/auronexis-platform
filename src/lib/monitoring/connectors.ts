import "server-only";

import { recordMonitoringActivity } from "@/lib/monitoring/activity";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";
import type {
  MonitoringConnectorConfiguration,
  MonitoringProvider,
} from "@/lib/monitoring/types";
import { getConnector } from "@/lib/monitoring/queries";

export type CreateConnectorInput = {
  name: string;
  provider: MonitoringProvider | string;
  configuration?: MonitoringConnectorConfiguration;
  enabled?: boolean;
};

export type UpdateConnectorInput = {
  name?: string;
  provider?: MonitoringProvider | string;
  configuration?: MonitoringConnectorConfiguration;
  enabled?: boolean;
  status?: string;
};

async function updateConnectorRow(
  organizationId: string,
  connectorId: string,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("monitoring_connectors")
    .update(patch as never)
    .eq("organization_id", organizationId)
    .eq("id", connectorId);

  return !error;
}

/** Create a monitoring connector. */
export async function createConnector(
  session: SessionContext,
  input: CreateConnectorInput,
): Promise<{ id: string } | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("monitoring_connectors")
    .insert({
      organization_id: session.organization.id,
      name: input.name.trim(),
      provider: input.provider,
      status: "active",
      enabled: input.enabled ?? true,
      configuration: input.configuration ?? {},
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    console.warn("[monitoring] createConnector failed:", error?.message);
    return null;
  }

  const connectorId = String((data as { id: string }).id);

  await recordMonitoringActivity({
    organizationId: session.organization.id,
    connectorId,
    eventType: "monitoring.connector_created",
    message: `Connector created: ${input.name.trim()}`,
    metadata: { provider: input.provider },
    actorUserId: session.user.id,
  });

  return { id: connectorId };
}

/** Update connector fields. */
export async function updateConnector(
  session: SessionContext,
  connectorId: string,
  input: UpdateConnectorInput,
): Promise<boolean> {
  const existing = await getConnector(session, connectorId);
  if (!existing) {
    return false;
  }

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.provider !== undefined) patch.provider = input.provider;
  if (input.configuration !== undefined) patch.configuration = input.configuration;
  if (input.enabled !== undefined) patch.enabled = input.enabled;
  if (input.status !== undefined) patch.status = input.status;

  const ok = await updateConnectorRow(session.organization.id, connectorId, patch);
  if (!ok) {
    return false;
  }

  await recordMonitoringActivity({
    organizationId: session.organization.id,
    connectorId,
    eventType: "monitoring.connector_updated",
    message: `Connector updated: ${input.name ?? existing.name}`,
    metadata: { changes: Object.keys(patch) },
    actorUserId: session.user.id,
  });

  return true;
}

/** Pause an active connector. */
export async function pauseConnector(session: SessionContext, connectorId: string): Promise<boolean> {
  const existing = await getConnector(session, connectorId);
  if (!existing || existing.status === "archived") {
    return false;
  }

  const ok = await updateConnectorRow(session.organization.id, connectorId, { status: "paused" });
  if (!ok) {
    return false;
  }

  await recordMonitoringActivity({
    organizationId: session.organization.id,
    connectorId,
    eventType: "monitoring.connector_updated",
    message: `Connector paused: ${existing.name}`,
    metadata: { status: "paused" },
    actorUserId: session.user.id,
  });

  return true;
}

/** Resume a paused connector. */
export async function resumeConnector(session: SessionContext, connectorId: string): Promise<boolean> {
  const existing = await getConnector(session, connectorId);
  if (!existing || existing.status === "archived") {
    return false;
  }

  const ok = await updateConnectorRow(session.organization.id, connectorId, {
    status: "active",
    enabled: true,
  });
  if (!ok) {
    return false;
  }

  await recordMonitoringActivity({
    organizationId: session.organization.id,
    connectorId,
    eventType: "monitoring.connector_recovered",
    message: `Connector resumed: ${existing.name}`,
    metadata: { status: "active" },
    actorUserId: session.user.id,
  });

  return true;
}

/** Archive a connector (soft delete). */
export async function archiveConnector(session: SessionContext, connectorId: string): Promise<boolean> {
  const existing = await getConnector(session, connectorId);
  if (!existing) {
    return false;
  }

  const ok = await updateConnectorRow(session.organization.id, connectorId, {
    status: "archived",
    enabled: false,
  });
  if (!ok) {
    return false;
  }

  await recordMonitoringActivity({
    organizationId: session.organization.id,
    connectorId,
    eventType: "monitoring.connector_updated",
    message: `Connector archived: ${existing.name}`,
    metadata: { status: "archived" },
    actorUserId: session.user.id,
  });

  return true;
}

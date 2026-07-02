import "server-only";

import { computeAndRecordClientHealth } from "@/lib/health/record";
import { recordIncidentActivity } from "@/lib/incidents/activity";
import { recordMonitoringActivity } from "@/lib/monitoring/activity";
import { recordRiskActivity } from "@/lib/risks/activity";
import { calculateRiskScore } from "@/lib/risks/scoring";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import { parseConnectorConfiguration, type MonitoringEventSeverity } from "@/lib/monitoring/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MONITORING_RISK_CATEGORY = "connector_failure";

type SideEffectInput = {
  organizationId: string;
  connectorId: string;
  clientId: string | null;
  severity: MonitoringEventSeverity;
  message: string;
  actorUserId: string | null;
};

async function getConnectorContext(organizationId: string, connectorId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("monitoring_connectors")
    .select("name, status, configuration")
    .eq("organization_id", organizationId)
    .eq("id", connectorId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const row = data as { name: string; status: string; configuration: unknown };
  return {
    name: row.name,
    status: row.status,
    configuration: parseConnectorConfiguration(row.configuration as never),
  };
}

async function findOpenMonitoringRisk(
  organizationId: string,
  clientId: string,
  connectorId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_risks")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .eq("source", "monitoring")
    .eq("category", MONITORING_RISK_CATEGORY)
    .contains("metadata", { connectorId })
    .in("status", OPEN_RISK_STATUSES)
    .maybeSingle();

  return (data as { id: string } | null) ?? null;
}

async function upsertMonitoringRisk(input: SideEffectInput, connectorName: string): Promise<void> {
  if (!input.clientId) {
    return;
  }

  const connector = await getConnectorContext(input.organizationId, input.connectorId);
  if (connector?.configuration.createRiskOnFailure === false) {
    return;
  }

  const isFailure = input.severity === "high" || input.severity === "critical";
  if (!isFailure) {
    return;
  }

  const supabase = await createClient();
  const existing = await findOpenMonitoringRisk(
    input.organizationId,
    input.clientId,
    input.connectorId,
  );

  const severity = input.severity === "critical" ? "critical" : "high";
  const title = `Monitoring connector failure: ${connectorName}`;
  const description = input.message;
  const recommendation = "Review connector configuration and restore service health.";

  if (existing) {
    await supabase
      .from("client_risks")
      .update({
        title,
        description,
        severity,
        recommendation,
      } as never)
      .eq("id", existing.id);
    return;
  }

  const severityImpact = severity === "critical" ? 5 : 4;
  const likelihood = 3;
  const riskScore = calculateRiskScore(likelihood, severityImpact);

  const { data, error } = await supabase
    .from("client_risks")
    .insert({
      organization_id: input.organizationId,
      client_id: input.clientId,
      title,
      description,
      severity,
      status: "open",
      source: "monitoring",
      category: MONITORING_RISK_CATEGORY,
      recommendation,
      likelihood,
      impact_score: severityImpact,
      risk_score: riskScore,
      metadata: { connectorId: input.connectorId },
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    console.warn("[monitoring] risk upsert failed:", error?.message);
    return;
  }

  const riskId = String((data as { id: string }).id);
  await recordRiskActivity({
    organizationId: input.organizationId,
    riskId,
    actorUserId: input.actorUserId,
    eventType: "risk.detected",
    message: `Risk detected: ${title}`,
    metadata: {
      clientId: input.clientId,
      connectorId: input.connectorId,
      source: "monitoring",
    },
  });
}

async function resolveMonitoringRisk(input: SideEffectInput): Promise<void> {
  if (!input.clientId) {
    return;
  }

  const existing = await findOpenMonitoringRisk(
    input.organizationId,
    input.clientId,
    input.connectorId,
  );

  if (!existing) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("client_risks")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    } as never)
    .eq("id", existing.id);
}

async function maybeCreateIncident(
  input: SideEffectInput,
  connectorName: string,
): Promise<void> {
  if (!input.clientId || input.severity !== "critical") {
    return;
  }

  const connector = await getConnectorContext(input.organizationId, input.connectorId);
  if (!connector?.configuration.createIncidentOnCritical) {
    return;
  }

  const admin = createAdminClient();
  const { data: orgUsers } = await admin
    .from("users")
    .select("id")
    .eq("organization_id", input.organizationId)
    .in("role", ["owner", "admin"])
    .limit(1);

  const assigneeId = (orgUsers?.[0] as { id: string } | undefined)?.id;
  if (!assigneeId) {
    return;
  }

  const title = `Monitoring alert: ${connectorName}`;
  const { data, error } = await admin
    .from("incidents")
    .insert({
      organization_id: input.organizationId,
      client_id: input.clientId,
      title,
      description: input.message,
      severity: "critical",
      status: "open",
      assigned_user_id: assigneeId,
      occurred_at: new Date().toISOString(),
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    console.warn("[monitoring] incident create failed:", error?.message);
    return;
  }

  const incidentId = String((data as { id: string }).id);
  await recordIncidentActivity({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    incidentId,
    eventType: "incident.created",
    title: `Incident created: ${title}`,
    metadata: { connectorId: input.connectorId, source: "monitoring" },
  });
}

async function maybeRefreshClientHealth(input: SideEffectInput): Promise<void> {
  if (!input.clientId) {
    return;
  }

  const connector = await getConnectorContext(input.organizationId, input.connectorId);
  if (connector?.configuration.healthImpactEnabled === false) {
    return;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clients")
      .select("id, name, status, updated_at")
      .eq("organization_id", input.organizationId)
      .eq("id", input.clientId)
      .maybeSingle();

    const client = data as { id: string; name: string; status: string; updated_at: string } | null;
    if (!client) {
      return;
    }

    await computeAndRecordClientHealth(
      {
        organization: { id: input.organizationId },
        user: { id: input.actorUserId ?? "" },
      } as never,
      {
        id: client.id,
        name: client.name,
        status: client.status as import("@/types/database").ClientStatus,
        updated_at: client.updated_at,
      },
      { actorUserId: input.actorUserId, emitActivity: true },
    );
  } catch (error) {
    console.warn("[monitoring] health refresh failed:", error);
  }
}

/** Apply risk, incident, and health side effects for a monitoring event — never throws. */
export async function recordMonitoringEventSideEffects(input: SideEffectInput): Promise<void> {
  try {
    const connector = await getConnectorContext(input.organizationId, input.connectorId);
    const connectorName = connector?.name ?? "Connector";
    const admin = createAdminClient();

    if (input.severity === "critical" || input.severity === "high") {
      await upsertMonitoringRisk(input, connectorName);
      if (input.severity === "critical") {
        await maybeCreateIncident(input, connectorName);
      }

      await admin
        .from("monitoring_connectors")
        .update({
          status: "failed",
          last_failure_at: new Date().toISOString(),
        } as never)
        .eq("id", input.connectorId);

      await recordMonitoringActivity({
        organizationId: input.organizationId,
        connectorId: input.connectorId,
        eventType: "monitoring.connector_failed",
        message: `Connector failed: ${connectorName}`,
        metadata: { severity: input.severity },
        actorUserId: input.actorUserId,
      });
    } else if (input.severity === "low") {
      await resolveMonitoringRisk(input);
      await admin
        .from("monitoring_connectors")
        .update({
          status: "active",
          last_success_at: new Date().toISOString(),
        } as never)
        .eq("id", input.connectorId);

      await recordMonitoringActivity({
        organizationId: input.organizationId,
        connectorId: input.connectorId,
        eventType: "monitoring.connector_recovered",
        message: `Connector recovered: ${connectorName}`,
        metadata: { severity: input.severity },
        actorUserId: input.actorUserId,
      });
    }

    await maybeRefreshClientHealth(input);
  } catch (error) {
    console.warn("[monitoring] side effects failed:", error);
  }
}

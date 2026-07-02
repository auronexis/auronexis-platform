"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import {
  archiveConnector,
  createConnector,
  pauseConnector,
  resumeConnector,
  updateConnector,
} from "@/lib/monitoring/connectors";
import { checkConnectorHealth, simulateConnectorCheck } from "@/lib/monitoring/health";
import { MONITORING_PROVIDERS } from "@/lib/monitoring/types";
import { canAccessModule } from "@/lib/rbac/permissions";

export type MonitoringActionState = {
  error?: string;
  success?: string;
};

const connectorSchema = z.object({
  name: z.string().trim().min(2, "Connector name is required."),
  provider: z.string().trim().min(1, "Select a provider."),
  clientId: z.string().trim().optional(),
  endpoint: z.string().trim().optional(),
  createRiskOnFailure: z.boolean().optional(),
  createIncidentOnCritical: z.boolean().optional(),
  healthImpactEnabled: z.boolean().optional(),
});

function parseConnectorForm(formData: FormData) {
  return connectorSchema.safeParse({
    name: formData.get("name"),
    provider: formData.get("provider"),
    clientId: formData.get("clientId") || undefined,
    endpoint: formData.get("endpoint") || undefined,
    createRiskOnFailure: formData.get("createRiskOnFailure") === "on",
    createIncidentOnCritical: formData.get("createIncidentOnCritical") === "on",
    healthImpactEnabled: formData.get("healthImpactEnabled") === "on",
  });
}

function assertMonitoringWrite(session: Awaited<ReturnType<typeof requireSession>>): boolean {
  return canAccessModule(session.role, "monitoring", "create");
}

/** Create a monitoring connector. */
export async function createMonitoringConnectorAction(
  _prevState: MonitoringActionState,
  formData: FormData,
): Promise<MonitoringActionState> {
  const session = await requireSession();

  if (!assertMonitoringWrite(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = parseConnectorForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid connector data." };
  }

  if (!MONITORING_PROVIDERS.includes(parsed.data.provider as (typeof MONITORING_PROVIDERS)[number])) {
    return { error: "Unsupported provider." };
  }

  const created = await createConnector(session, {
    name: parsed.data.name,
    provider: parsed.data.provider,
    configuration: {
      clientId: parsed.data.clientId || null,
      endpoint: parsed.data.endpoint || null,
      createRiskOnFailure: parsed.data.createRiskOnFailure ?? true,
      createIncidentOnCritical: parsed.data.createIncidentOnCritical ?? false,
      healthImpactEnabled: parsed.data.healthImpactEnabled ?? true,
    },
  });

  if (!created) {
    return { error: "Unable to create connector." };
  }

  revalidatePath("/monitoring");
  redirect(`/monitoring/${created.id}`);
}

/** Update a monitoring connector. */
export async function updateMonitoringConnectorAction(
  connectorId: string,
  _prevState: MonitoringActionState,
  formData: FormData,
): Promise<MonitoringActionState> {
  const session = await requireSession();

  if (!assertMonitoringWrite(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = parseConnectorForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid connector data." };
  }

  const ok = await updateConnector(session, connectorId, {
    name: parsed.data.name,
    provider: parsed.data.provider,
    configuration: {
      clientId: parsed.data.clientId || null,
      endpoint: parsed.data.endpoint || null,
      createRiskOnFailure: parsed.data.createRiskOnFailure ?? true,
      createIncidentOnCritical: parsed.data.createIncidentOnCritical ?? false,
      healthImpactEnabled: parsed.data.healthImpactEnabled ?? true,
    },
  });

  if (!ok) {
    return { error: "Unable to update connector." };
  }

  revalidatePath("/monitoring");
  revalidatePath(`/monitoring/${connectorId}`);
  return { success: "Connector updated." };
}

export async function pauseMonitoringConnectorAction(connectorId: string): Promise<MonitoringActionState> {
  const session = await requireSession();
  if (!assertMonitoringWrite(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const ok = await pauseConnector(session, connectorId);
  revalidatePath("/monitoring");
  revalidatePath(`/monitoring/${connectorId}`);
  return ok ? { success: "Connector paused." } : { error: "Unable to pause connector." };
}

export async function resumeMonitoringConnectorAction(connectorId: string): Promise<MonitoringActionState> {
  const session = await requireSession();
  if (!assertMonitoringWrite(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const ok = await resumeConnector(session, connectorId);
  revalidatePath("/monitoring");
  revalidatePath(`/monitoring/${connectorId}`);
  return ok ? { success: "Connector resumed." } : { error: "Unable to resume connector." };
}

export async function archiveMonitoringConnectorAction(connectorId: string): Promise<MonitoringActionState> {
  const session = await requireSession();
  if (!assertMonitoringWrite(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const ok = await archiveConnector(session, connectorId);
  revalidatePath("/monitoring");
  return ok ? { success: "Connector archived." } : { error: "Unable to archive connector." };
}

export async function checkMonitoringConnectorAction(connectorId: string): Promise<MonitoringActionState> {
  const session = await requireSession();
  if (!canAccessModule(session.role, "monitoring", "read")) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const result = await checkConnectorHealth(session, connectorId);
  revalidatePath("/monitoring");
  revalidatePath(`/monitoring/${connectorId}`);
  return result
    ? { success: result.message }
    : { error: "Unable to run health check." };
}

export async function simulateMonitoringEventAction(
  connectorId: string,
  formData: FormData,
): Promise<MonitoringActionState> {
  const session = await requireSession();
  if (!assertMonitoringWrite(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const severity = String(formData.get("severity") ?? "medium") as "low" | "medium" | "high" | "critical";
  const message = String(formData.get("message") ?? "").trim() || undefined;
  const eventId = await simulateConnectorCheck(session, connectorId, { severity, message });

  revalidatePath("/monitoring");
  revalidatePath(`/monitoring/${connectorId}`);
  return eventId ? { success: "Simulated event recorded." } : { error: "Unable to simulate event." };
}

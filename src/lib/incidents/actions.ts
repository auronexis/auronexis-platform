"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordIncidentActivity } from "@/lib/incidents/activity";
import { dispatchAutomation } from "@/lib/automation";
import { recordSlaResolvedIfNeeded } from "@/lib/sla/evaluations";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature, requireFeature } from "@/lib/plans/guards";
import {
  canEditIncident,
  canManageIncidentLifecycle,
} from "@/lib/incidents/guards";
import { getIncidentById } from "@/lib/incidents/queries";
import { STAFF_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import { AuthorizationError, requirePermission } from "@/lib/rbac/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database, IncidentStatus } from "@/types/database";

type IncidentInsert = Database["public"]["Tables"]["incidents"]["Insert"];
type IncidentUpdate = Database["public"]["Tables"]["incidents"]["Update"];

export type IncidentActionState = {
  error?: string;
  success?: string;
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

const incidentFieldsSchema = z.object({
  title: z.string().trim().min(2, "Incident title is required."),
  clientId: z.string().uuid("Select a client."),
  riskId: z
    .string()
    .optional()
    .transform((value) => (!value || value.trim().length === 0 ? null : value))
    .refine((value) => value === null || z.string().uuid().safeParse(value).success, {
      message: "Select a valid linked risk.",
    }),
  description: optionalText,
  severity: z.enum(["low", "medium", "high", "critical"] as const),
  status: z.enum(["open", "investigating", "resolved", "archived"] as const),
  assignedUserId: z.string().uuid("Select an assignee.").optional(),
  occurredAt: z.string().trim().min(1, "Occurred date is required."),
  dueAt: z
    .string()
    .optional()
    .transform((value) => (!value || value.trim().length === 0 ? null : value)),
  resolutionNotes: optionalText,
});

function parseIncidentForm(formData: FormData) {
  return incidentFieldsSchema.safeParse({
    title: formData.get("title"),
    clientId: formData.get("clientId"),
    riskId: formData.get("riskId"),
    description: formData.get("description"),
    severity: formData.get("severity") ?? "medium",
    status: formData.get("status") ?? "open",
    assignedUserId: formData.get("assignedUserId") || undefined,
    occurredAt: formData.get("occurredAt"),
    dueAt: formData.get("dueAt"),
    resolutionNotes: formData.get("resolutionNotes"),
  });
}

async function verifyClientInOrg(
  organizationId: string,
  clientId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  return Boolean(data);
}

async function verifyUserInOrg(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .eq("organization_id", organizationId)
    .eq("is_disabled", false)
    .maybeSingle();

  return Boolean(data as { id: string } | null);
}

async function verifyRiskInOrg(
  organizationId: string,
  clientId: string,
  riskId: string | null,
): Promise<boolean> {
  if (!riskId) {
    return true;
  }

  const supabase = await createClient();

  const { data: clientRisk } = await supabase
    .from("client_risks")
    .select("id, client_id")
    .eq("id", riskId)
    .eq("organization_id", organizationId)
    .in("status", OPEN_RISK_STATUSES)
    .maybeSingle();

  if (clientRisk) {
    const risk = clientRisk as { id: string; client_id: string };
    return risk.client_id === clientId;
  }

  const { data: legacyRisk } = await supabase
    .from("risks")
    .select("id, client_id")
    .eq("id", riskId)
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .maybeSingle();

  const legacy = legacyRisk as { id: string; client_id: string } | null;
  return Boolean(legacy && legacy.client_id === clientId);
}

async function resolveIncidentRiskLink(
  organizationId: string,
  clientId: string,
  riskId: string | null,
): Promise<Pick<IncidentInsert, "risk_id" | "client_risk_id">> {
  if (!riskId) {
    return { risk_id: null, client_risk_id: null };
  }

  const supabase = await createClient();
  const { data: clientRisk } = await supabase
    .from("client_risks")
    .select("id")
    .eq("id", riskId)
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .in("status", OPEN_RISK_STATUSES)
    .maybeSingle();

  if (clientRisk) {
    return { risk_id: null, client_risk_id: riskId };
  }

  return { risk_id: riskId, client_risk_id: null };
}

function assertStaffStatusAllowed(status: IncidentStatus): void {
  if (!STAFF_INCIDENT_STATUSES.includes(status)) {
    throw new AuthorizationError("You cannot set this incident status.");
  }
}

function toIsoTimestamp(value: string): string {
  return new Date(value).toISOString();
}

/** Create an incident — Owner/Admin or Staff (self-assigned). */
export async function createIncidentAction(
  _prevState: IncidentActionState,
  formData: FormData,
): Promise<IncidentActionState> {
  const session = await requireSession();
  requirePermission(session.role, "incidents", "create");

  const planCheck = await requireFeature(session.organization.id, "incidents");
  if (!planCheck.allowed) {
    return { error: planCheck.message };
  }

  const parsed = parseIncidentForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid incident data." };
  }

  const assignedUserId =
    session.role === "staff" ? session.user.id : parsed.data.assignedUserId;

  if (!assignedUserId) {
    return { error: "Select an assignee." };
  }

  if (session.role === "staff") {
    assertStaffStatusAllowed(parsed.data.status);
  }

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  if (!(await verifyUserInOrg(session.organization.id, assignedUserId))) {
    return { error: "Selected assignee is not valid." };
  }

  if (
    !(await verifyRiskInOrg(
      session.organization.id,
      parsed.data.clientId,
      parsed.data.riskId,
    ))
  ) {
    return { error: "Selected risk is not valid for this client." };
  }

  const riskLink = await resolveIncidentRiskLink(
    session.organization.id,
    parsed.data.clientId,
    parsed.data.riskId,
  );

  const supabase = await createClient();
  const insertPayload: IncidentInsert = {
    organization_id: session.organization.id,
    client_id: parsed.data.clientId,
    ...riskLink,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    severity: parsed.data.severity,
    status: parsed.data.status,
    assigned_user_id: assignedUserId,
    occurred_at: toIsoTimestamp(parsed.data.occurredAt),
    due_at: parsed.data.dueAt ? toIsoTimestamp(parsed.data.dueAt) : null,
    resolution_notes: parsed.data.resolutionNotes ?? null,
  };

  const { data, error } = await supabase
    .from("incidents")
    .insert(insertPayload as never)
    .select("id")
    .single();

  const created = data as { id: string } | null;

  if (error || !created) {
    return { error: "Unable to create incident." };
  }

  await recordIncidentActivity({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    incidentId: created.id,
    eventType: "incident.created",
    title: `Incident created: ${parsed.data.title}`,
    metadata: {
      title: parsed.data.title,
      severity: parsed.data.severity,
      status: parsed.data.status,
      assignedUserId,
    },
  });

  await dispatchAutomation({
    trigger: "incident_created",
    organizationId: session.organization.id,
    entityType: "incident",
    entityId: created.id,
    clientId: parsed.data.clientId,
    actorUserId: session.user.id,
    payload: {
      title: parsed.data.title,
      severity: parsed.data.severity,
      status: parsed.data.status,
      clientId: parsed.data.clientId,
      assignedUserId,
    },
  });

  revalidatePath("/incidents");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  redirect(`/incidents/${created.id}`);
}

/** Update an incident — Owner/Admin or assigned Staff. */
export async function updateIncidentAction(
  incidentId: string,
  _prevState: IncidentActionState,
  formData: FormData,
): Promise<IncidentActionState> {
  const session = await requireSession();
  requirePermission(session.role, "incidents", "update");

  const planCheck = await requireFeature(session.organization.id, "incidents");
  if (!planCheck.allowed) {
    return { error: planCheck.message };
  }

  const existing = await getIncidentById(session, incidentId);

  if (!existing) {
    return { error: "Incident not found." };
  }

  if (!canEditIncident(session, existing)) {
    throw new AuthorizationError();
  }

  const parsed = parseIncidentForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid incident data." };
  }

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  let assignedUserId = existing.assigned_user_id;

  if (session.role === "staff") {
    assertStaffStatusAllowed(parsed.data.status);

    if (parsed.data.assignedUserId && parsed.data.assignedUserId !== session.user.id) {
      throw new AuthorizationError();
    }
  } else {
    assignedUserId = parsed.data.assignedUserId ?? existing.assigned_user_id;

    if (!(await verifyUserInOrg(session.organization.id, assignedUserId))) {
      return { error: "Selected assignee is not valid." };
    }

    if (
      (parsed.data.status === "resolved" || parsed.data.status === "archived") &&
      !canManageIncidentLifecycle(session)
    ) {
      throw new AuthorizationError();
    }
  }

  if (
    !(await verifyRiskInOrg(
      session.organization.id,
      parsed.data.clientId,
      parsed.data.riskId,
    ))
  ) {
    return { error: "Selected risk is not valid for this client." };
  }

  const riskLink = await resolveIncidentRiskLink(
    session.organization.id,
    parsed.data.clientId,
    parsed.data.riskId,
  );

  const updatePayload: IncidentUpdate = {
    client_id: parsed.data.clientId,
    ...riskLink,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    severity: parsed.data.severity,
    status: parsed.data.status,
    assigned_user_id: assignedUserId,
    occurred_at: toIsoTimestamp(parsed.data.occurredAt),
    due_at: parsed.data.dueAt ? toIsoTimestamp(parsed.data.dueAt) : null,
    resolution_notes: parsed.data.resolutionNotes ?? null,
  };

  if (parsed.data.status === "resolved" && existing.status !== "resolved") {
    updatePayload.resolved_at = new Date().toISOString();
  }

  if (parsed.data.status !== "resolved" && existing.status === "resolved") {
    updatePayload.resolved_at = null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("incidents")
    .update(updatePayload as never)
    .eq("id", incidentId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update incident." };
  }

  if (assignedUserId !== existing.assigned_user_id) {
    await recordIncidentActivity({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      incidentId,
      eventType: "incident.assigned",
      title: `Incident assigned: ${parsed.data.title}`,
      metadata: {
        previousAssigneeId: existing.assigned_user_id,
        assignedUserId,
      },
    });
  }

  if (parsed.data.status !== existing.status) {
    const statusEventType =
      parsed.data.status === "resolved"
        ? "incident.resolved"
        : parsed.data.status === "archived"
          ? "incident.closed"
          : "incident.status_changed";

    await recordIncidentActivity({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      incidentId,
      eventType: statusEventType,
      title: `Incident status changed to ${parsed.data.status}`,
      metadata: {
        previousStatus: existing.status,
        status: parsed.data.status,
        title: parsed.data.title,
      },
    });
  } else if (
    parsed.data.title !== existing.title ||
    parsed.data.severity !== existing.severity
  ) {
    await recordIncidentActivity({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      incidentId,
      eventType: "incident.status_changed",
      title: `Incident updated: ${parsed.data.title}`,
      metadata: {
        title: parsed.data.title,
        severity: parsed.data.severity,
        status: parsed.data.status,
      },
    });
  }

  await dispatchAutomation({
    trigger: "incident_updated",
    organizationId: session.organization.id,
    entityType: "incident",
    entityId: incidentId,
    clientId: parsed.data.clientId,
    actorUserId: session.user.id,
    payload: {
      title: parsed.data.title,
      severity: parsed.data.severity,
      status: parsed.data.status,
      clientId: parsed.data.clientId,
    },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  return { success: "Incident updated." };
}

/** Resolve an incident — Owner/Admin only. */
export async function resolveIncidentAction(
  incidentId: string,
  _prevState: IncidentActionState,
  formData: FormData,
): Promise<IncidentActionState> {
  const session = await requireSession();

  if (!canManageIncidentLifecycle(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "incidents");

  const existing = await getIncidentById(session, incidentId);

  if (!existing) {
    return { error: "Incident not found." };
  }

  const resolutionNotes = optionalText.safeParse(formData.get("resolutionNotes"));
  const notes = resolutionNotes.success ? resolutionNotes.data ?? null : null;

  const supabase = await createClient();
  const updatePayload: IncidentUpdate = {
    status: "resolved",
    resolved_at: new Date().toISOString(),
    resolution_notes: notes,
  };

  const { error } = await supabase
    .from("incidents")
    .update(updatePayload as never)
    .eq("id", incidentId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to resolve incident." };
  }

  await recordIncidentActivity({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    incidentId,
    eventType: "incident.resolved",
    title: `Incident resolved: ${existing.title}`,
    metadata: { title: existing.title },
  });

  await recordSlaResolvedIfNeeded({
    organizationId: session.organization.id,
    entityType: "incident",
    entityId: incidentId,
    clientId: existing.client_id,
    title: existing.title,
    actorUserId: session.user.id,
  });

  await dispatchAutomation({
    trigger: "incident_updated",
    organizationId: session.organization.id,
    entityType: "incident",
    entityId: incidentId,
    clientId: existing.client_id,
    actorUserId: session.user.id,
    payload: {
      title: existing.title,
      severity: existing.severity,
      status: "resolved",
      clientId: existing.client_id,
    },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  redirect(`/incidents/${incidentId}`);
}

/** Archive an incident — Owner/Admin only. */
export async function archiveIncidentAction(incidentId: string): Promise<void> {
  const session = await requireSession();

  if (!canManageIncidentLifecycle(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "incidents");

  const existing = await getIncidentById(session, incidentId);

  if (!existing) {
    throw new Error("Incident not found.");
  }

  const supabase = await createClient();
  const updatePayload: IncidentUpdate = { status: "archived" };

  const { error } = await supabase
    .from("incidents")
    .update(updatePayload as never)
    .eq("id", incidentId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to archive incident.");
  }

  await recordIncidentActivity({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    incidentId,
    eventType: "incident.closed",
    title: `Incident closed: ${existing.title}`,
    metadata: { title: existing.title },
  });

  await dispatchAutomation({
    trigger: "incident_updated",
    organizationId: session.organization.id,
    entityType: "incident",
    entityId: incidentId,
    clientId: existing.client_id,
    actorUserId: session.user.id,
    payload: {
      title: existing.title,
      severity: existing.severity,
      status: "archived",
      clientId: existing.client_id,
    },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  redirect("/incidents");
}

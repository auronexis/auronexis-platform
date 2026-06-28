"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { dispatchAutomation } from "@/lib/automation";
import { recordSlaResolvedIfNeeded } from "@/lib/sla/evaluations";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature, requireFeature } from "@/lib/plans/guards";
import { AuthorizationError, requirePermission } from "@/lib/rbac/guards";
import { createClient } from "@/lib/supabase/server";
import { canEditRisk, canManageRiskLifecycle } from "@/lib/risks/guards";
import { getRiskById } from "@/lib/risks/queries";
import { STAFF_RISK_STATUSES } from "@/lib/risks/types";
import type { Database, RiskStatus } from "@/types/database";

type RiskInsert = Database["public"]["Tables"]["risks"]["Insert"];
type RiskUpdate = Database["public"]["Tables"]["risks"]["Update"];

export type RiskActionState = {
  error?: string;
  success?: string;
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

const riskFieldsSchema = z.object({
  title: z.string().trim().min(2, "Risk title is required."),
  clientId: z.string().uuid("Select a client."),
  description: optionalText,
  severity: z.enum(["low", "medium", "high", "critical"] as const),
  status: z.enum(["open", "in_progress", "resolved", "archived"] as const),
  ownerUserId: z.string().uuid("Select an owner.").optional(),
  dueDate: z
    .string()
    .optional()
    .transform((value) => (!value || value.trim().length === 0 ? null : value)),
  resolutionNotes: optionalText,
});

function parseRiskForm(formData: FormData) {
  return riskFieldsSchema.safeParse({
    title: formData.get("title"),
    clientId: formData.get("clientId"),
    description: formData.get("description"),
    severity: formData.get("severity") ?? "medium",
    status: formData.get("status") ?? "open",
    ownerUserId: formData.get("ownerUserId") || undefined,
    dueDate: formData.get("dueDate"),
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

function assertStaffStatusAllowed(status: RiskStatus): void {
  if (!STAFF_RISK_STATUSES.includes(status)) {
    throw new AuthorizationError("You cannot set this risk status.");
  }
}

/** Create a risk — Owner/Admin or Staff (self-assigned). */
export async function createRiskAction(
  _prevState: RiskActionState,
  formData: FormData,
): Promise<RiskActionState> {
  const session = await requireSession();
  requirePermission(session.role, "risks", "create");

  const planCheck = await requireFeature(session.organization.id, "risks");
  if (!planCheck.allowed) {
    return { error: planCheck.message };
  }

  const parsed = parseRiskForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid risk data." };
  }

  const ownerUserId =
    session.role === "staff" ? session.user.id : parsed.data.ownerUserId;

  if (!ownerUserId) {
    return { error: "Select an owner." };
  }

  if (session.role === "staff") {
    assertStaffStatusAllowed(parsed.data.status);
  }

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  if (!(await verifyUserInOrg(session.organization.id, ownerUserId))) {
    return { error: "Selected owner is not valid." };
  }

  const supabase = await createClient();
  const insertPayload: RiskInsert = {
    organization_id: session.organization.id,
    client_id: parsed.data.clientId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    severity: parsed.data.severity,
    status: parsed.data.status,
    owner_user_id: ownerUserId,
    due_date: parsed.data.dueDate,
    resolution_notes: parsed.data.resolutionNotes ?? null,
  };

  const { data, error } = await supabase
    .from("risks")
    .insert(insertPayload as never)
    .select("id")
    .single();

  const created = data as { id: string } | null;

  if (error || !created) {
    return { error: "Unable to create risk." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "risk",
    entityId: created.id,
    action: "created",
    title: `Risk created: ${parsed.data.title}`,
    metadata: { riskId: created.id, title: parsed.data.title },
  });

  await dispatchAutomation({
    trigger: "risk_created",
    organizationId: session.organization.id,
    entityType: "risk",
    entityId: created.id,
    clientId: parsed.data.clientId,
    actorUserId: session.user.id,
    payload: {
      title: parsed.data.title,
      severity: parsed.data.severity,
      status: parsed.data.status,
      clientId: parsed.data.clientId,
      assignedUserId: ownerUserId,
    },
  });

  revalidatePath("/risks");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  redirect(`/risks/${created.id}`);
}

/** Update a risk — Owner/Admin or assigned Staff. */
export async function updateRiskAction(
  riskId: string,
  _prevState: RiskActionState,
  formData: FormData,
): Promise<RiskActionState> {
  const session = await requireSession();
  requirePermission(session.role, "risks", "update");

  const planCheck = await requireFeature(session.organization.id, "risks");
  if (!planCheck.allowed) {
    return { error: planCheck.message };
  }

  const existing = await getRiskById(session, riskId);

  if (!existing) {
    return { error: "Risk not found." };
  }

  if (!canEditRisk(session, existing)) {
    throw new AuthorizationError();
  }

  const parsed = parseRiskForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid risk data." };
  }

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  let ownerUserId = existing.owner_user_id;

  if (session.role === "staff") {
    assertStaffStatusAllowed(parsed.data.status);

    if (parsed.data.ownerUserId && parsed.data.ownerUserId !== session.user.id) {
      throw new AuthorizationError();
    }
  } else {
    ownerUserId = parsed.data.ownerUserId ?? existing.owner_user_id;

    if (!(await verifyUserInOrg(session.organization.id, ownerUserId))) {
      return { error: "Selected owner is not valid." };
    }

    if (
      (parsed.data.status === "resolved" || parsed.data.status === "archived") &&
      !canManageRiskLifecycle(session)
    ) {
      throw new AuthorizationError();
    }
  }

  const updatePayload: RiskUpdate = {
    client_id: parsed.data.clientId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    severity: parsed.data.severity,
    status: parsed.data.status,
    owner_user_id: ownerUserId,
    due_date: parsed.data.dueDate,
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
    .from("risks")
    .update(updatePayload as never)
    .eq("id", riskId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update risk." };
  }

  const action =
    parsed.data.status === "resolved" && existing.status !== "resolved"
      ? "resolved"
      : parsed.data.status === "archived" && existing.status !== "archived"
        ? "archived"
        : "updated";

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "risk",
    entityId: riskId,
    action,
    title: `Risk ${action}: ${parsed.data.title}`,
    metadata: { riskId, title: parsed.data.title, status: parsed.data.status },
  });

  await dispatchAutomation({
    trigger: "risk_updated",
    organizationId: session.organization.id,
    entityType: "risk",
    entityId: riskId,
    clientId: parsed.data.clientId,
    actorUserId: session.user.id,
    payload: {
      title: parsed.data.title,
      severity: parsed.data.severity,
      status: parsed.data.status,
      clientId: parsed.data.clientId,
    },
  });

  revalidatePath("/risks");
  revalidatePath(`/risks/${riskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  return { success: "Risk updated." };
}

/** Resolve a risk — Owner/Admin only. */
export async function resolveRiskAction(
  riskId: string,
  _prevState: RiskActionState,
  formData: FormData,
): Promise<RiskActionState> {
  const session = await requireSession();

  if (!canManageRiskLifecycle(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "risks");

  const existing = await getRiskById(session, riskId);

  if (!existing) {
    return { error: "Risk not found." };
  }

  const resolutionNotes = optionalText.safeParse(formData.get("resolutionNotes"));
  const notes = resolutionNotes.success ? resolutionNotes.data ?? null : null;

  const supabase = await createClient();
  const updatePayload: RiskUpdate = {
    status: "resolved",
    resolved_at: new Date().toISOString(),
    resolution_notes: notes,
  };

  const { error } = await supabase
    .from("risks")
    .update(updatePayload as never)
    .eq("id", riskId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to resolve risk." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "risk",
    entityId: riskId,
    action: "resolved",
    title: `Risk resolved: ${existing.title}`,
    metadata: { riskId, title: existing.title },
  });

  await recordSlaResolvedIfNeeded({
    organizationId: session.organization.id,
    entityType: "risk",
    entityId: riskId,
    clientId: existing.client_id,
    title: existing.title,
    actorUserId: session.user.id,
  });

  await dispatchAutomation({
    trigger: "risk_updated",
    organizationId: session.organization.id,
    entityType: "risk",
    entityId: riskId,
    clientId: existing.client_id,
    actorUserId: session.user.id,
    payload: {
      title: existing.title,
      severity: existing.severity,
      status: "resolved",
      clientId: existing.client_id,
    },
  });

  revalidatePath("/risks");
  revalidatePath(`/risks/${riskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  redirect(`/risks/${riskId}`);
}

/** Archive a risk — Owner/Admin only. */
export async function archiveRiskAction(riskId: string): Promise<void> {
  const session = await requireSession();

  if (!canManageRiskLifecycle(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "risks");

  const existing = await getRiskById(session, riskId);

  if (!existing) {
    throw new Error("Risk not found.");
  }

  const supabase = await createClient();
  const updatePayload: RiskUpdate = { status: "archived" };

  const { error } = await supabase
    .from("risks")
    .update(updatePayload as never)
    .eq("id", riskId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to archive risk.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "risk",
    entityId: riskId,
    action: "archived",
    title: `Risk archived: ${existing.title}`,
    metadata: { riskId, title: existing.title },
  });

  await dispatchAutomation({
    trigger: "risk_updated",
    organizationId: session.organization.id,
    entityType: "risk",
    entityId: riskId,
    clientId: existing.client_id,
    actorUserId: session.user.id,
    payload: {
      title: existing.title,
      severity: existing.severity,
      status: "archived",
      clientId: existing.client_id,
    },
  });

  revalidatePath("/risks");
  revalidatePath(`/risks/${riskId}`);
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  redirect("/risks");
}

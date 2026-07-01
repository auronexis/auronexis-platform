"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordRiskActivity } from "@/lib/risks/activity";
import { assertPermissionSafe, sessionHasPermission } from "@/lib/authorization/guards";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { canEditRisk } from "@/lib/risks/guards";
import { getRiskById } from "@/lib/risks/queries";
import {
  calculateRiskScore,
  clampScoreDimension,
  severityFromRiskScore,
} from "@/lib/risks/scoring";
import type { Database } from "@/types/database";
import type { RiskActivityEventType } from "@/lib/risks/activity";

type ClientRiskInsert = Database["public"]["Tables"]["client_risks"]["Insert"];
type ClientRiskUpdate = Database["public"]["Tables"]["client_risks"]["Update"];

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

const scoreDimension = z.coerce.number().int().min(1).max(5);

const riskFieldsSchema = z.object({
  title: z.string().trim().min(2, "Risk title is required."),
  clientId: z.string().uuid("Select a client."),
  description: optionalText,
  severity: z.enum(["low", "medium", "high", "critical"] as const),
  status: z.enum(["open", "acknowledged", "mitigated", "resolved", "dismissed"] as const).optional(),
  source: z
    .enum(["manual", "health_engine", "sla", "report", "activity", "portal"] as const)
    .optional(),
  category: optionalText,
  impact: optionalText,
  recommendation: optionalText,
  mitigationPlan: optionalText,
  ownerUserId: z.string().uuid().optional().nullable(),
  dueAt: z
    .string()
    .optional()
    .transform((value) => (!value || value.trim().length === 0 ? null : value)),
  likelihood: scoreDimension.optional(),
  impactScore: scoreDimension.optional(),
});

function parseRiskForm(formData: FormData) {
  return riskFieldsSchema.safeParse({
    title: formData.get("title"),
    clientId: formData.get("clientId"),
    description: formData.get("description"),
    severity: formData.get("severity") ?? "medium",
    status: formData.get("status") ?? "open",
    source: formData.get("source") ?? "manual",
    category: formData.get("category"),
    impact: formData.get("impact"),
    recommendation: formData.get("recommendation"),
    mitigationPlan: formData.get("mitigationPlan"),
    ownerUserId: formData.get("ownerUserId") || undefined,
    dueAt: formData.get("dueAt"),
    likelihood: formData.get("likelihood") || undefined,
    impactScore: formData.get("impactScore") || undefined,
  });
}

async function verifyClientInOrg(organizationId: string, clientId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  return Boolean(data);
}

async function verifyUserInOrg(organizationId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .eq("organization_id", organizationId)
    .eq("is_disabled", false)
    .maybeSingle();
  return Boolean(data);
}

function revalidateRiskPaths(clientId: string, riskId?: string) {
  revalidatePath("/risks");
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${clientId}`);
  if (riskId) {
    revalidatePath(`/risks/${riskId}`);
  }
}

function assertEditableRisk(
  session: Awaited<ReturnType<typeof requireSession>>,
  risk: Awaited<ReturnType<typeof getRiskById>>,
):
  | { kind: "error"; state: RiskActionState }
  | { kind: "ok"; risk: NonNullable<Awaited<ReturnType<typeof getRiskById>>> } {
  if (!risk) {
    return { kind: "error", state: { error: "Risk not found." } };
  }

  if (!canEditRisk(session, risk)) {
    return { kind: "error", state: { error: "You cannot edit this risk." } };
  }

  return { kind: "ok", risk };
}

export async function createRiskAction(
  _prevState: RiskActionState,
  formData: FormData,
): Promise<RiskActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "risks.write");
  if (denied) {
    return denied;
  }

  const parsed = parseRiskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid risk data." };
  }

  const ownerUserId = parsed.data.ownerUserId ?? session.user.id;
  const likelihood = clampScoreDimension(parsed.data.likelihood ?? 3);
  const impactScore = clampScoreDimension(parsed.data.impactScore ?? 3);
  const riskScore = calculateRiskScore(likelihood, impactScore);

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  if (!(await verifyUserInOrg(session.organization.id, ownerUserId))) {
    return { error: "Selected owner is not valid." };
  }

  const supabase = await createClient();
  const payload: ClientRiskInsert = {
    organization_id: session.organization.id,
    client_id: parsed.data.clientId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    severity: parsed.data.severity ?? severityFromRiskScore(riskScore),
    status: "open",
    source: parsed.data.source ?? "manual",
    category: parsed.data.category ?? null,
    impact: parsed.data.impact ?? null,
    recommendation: parsed.data.recommendation ?? null,
    mitigation_plan: parsed.data.mitigationPlan ?? null,
    owner_user_id: ownerUserId,
    due_at: parsed.data.dueAt,
    likelihood,
    impact_score: impactScore,
    risk_score: riskScore,
  };

  const { data, error } = await supabase
    .from("client_risks")
    .insert(payload as never)
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  const riskId = String((data as { id: string }).id);
  await recordRiskActivity({
    organizationId: session.organization.id,
    riskId,
    actorUserId: session.user.id,
    eventType: "risk.created",
    message: `Risk created: ${parsed.data.title}`,
    metadata: { riskScore, likelihood, impactScore },
  });

  revalidateRiskPaths(parsed.data.clientId, riskId);
  redirect(`/risks/${riskId}`);
}

export async function updateRiskAction(
  riskId: string,
  _prevState: RiskActionState,
  formData: FormData,
): Promise<RiskActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "risks.write");
  if (denied) {
    return denied;
  }

  const editable = assertEditableRisk(session, await getRiskById(session, riskId));
  if (editable.kind === "error") {
    return editable.state;
  }
  const existing = editable.risk;

  const parsed = parseRiskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid risk data." };
  }

  const ownerUserId = parsed.data.ownerUserId ?? existing.owner_user_id ?? session.user.id;
  const likelihood = clampScoreDimension(parsed.data.likelihood ?? existing.likelihood ?? 3);
  const impactScore = clampScoreDimension(parsed.data.impactScore ?? existing.impact_score ?? 3);
  const riskScore = calculateRiskScore(likelihood, impactScore);

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  if (!(await verifyUserInOrg(session.organization.id, ownerUserId))) {
    return { error: "Selected owner is not valid." };
  }

  const supabase = await createClient();
  const update: ClientRiskUpdate = {
    client_id: parsed.data.clientId,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    severity: parsed.data.severity ?? severityFromRiskScore(riskScore),
    category: parsed.data.category ?? null,
    impact: parsed.data.impact ?? null,
    recommendation: parsed.data.recommendation ?? null,
    mitigation_plan: parsed.data.mitigationPlan ?? existing.mitigation_plan ?? null,
    owner_user_id: ownerUserId,
    due_at: parsed.data.dueAt,
    likelihood,
    impact_score: impactScore,
    risk_score: riskScore,
  };

  if (parsed.data.status) {
    update.status = parsed.data.status;
  }

  const { error } = await supabase
    .from("client_risks")
    .update(update as never)
    .eq("id", riskId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: error.message };
  }

  const scoreChanged =
    likelihood !== (existing.likelihood ?? 3) ||
    impactScore !== (existing.impact_score ?? 3);

  if (scoreChanged) {
    await recordRiskActivity({
      organizationId: session.organization.id,
      riskId,
      actorUserId: session.user.id,
      eventType: "risk.score_changed",
      message: `Risk score updated to ${riskScore} for ${parsed.data.title}`,
      metadata: {
        previousScore: existing.risk_score,
        riskScore,
        likelihood,
        impactScore,
      },
    });
  }

  if (ownerUserId !== existing.owner_user_id) {
    await recordRiskActivity({
      organizationId: session.organization.id,
      riskId,
      actorUserId: session.user.id,
      eventType: "risk.assigned",
      message: `Risk owner updated for ${parsed.data.title}`,
      metadata: { ownerUserId },
    });
  }

  await recordRiskActivity({
    organizationId: session.organization.id,
    riskId,
    actorUserId: session.user.id,
    eventType: "risk.updated",
    message: `Risk updated: ${parsed.data.title}`,
  });

  revalidateRiskPaths(parsed.data.clientId, riskId);
  return { success: "Risk updated." };
}

export async function updateRiskScoreAction(
  riskId: string,
  likelihood: number,
  impactScore: number,
): Promise<RiskActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "risks.write");
  if (denied) {
    return denied;
  }

  const editable = assertEditableRisk(session, await getRiskById(session, riskId));
  if (editable.kind === "error") {
    return editable.state;
  }
  const existing = editable.risk;

  const nextLikelihood = clampScoreDimension(likelihood);
  const nextImpact = clampScoreDimension(impactScore);
  const riskScore = calculateRiskScore(nextLikelihood, nextImpact);

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_risks")
    .update({
      likelihood: nextLikelihood,
      impact_score: nextImpact,
      risk_score: riskScore,
      severity: severityFromRiskScore(riskScore),
    } as never)
    .eq("id", riskId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: error.message };
  }

  await recordRiskActivity({
    organizationId: session.organization.id,
    riskId,
    actorUserId: session.user.id,
    eventType: "risk.score_changed",
    message: `Risk score set to ${riskScore} for ${existing.title}`,
    metadata: {
      previousScore: existing.risk_score,
      riskScore,
      likelihood: nextLikelihood,
      impactScore: nextImpact,
    },
  });

  revalidateRiskPaths(existing.client_id, riskId);
  return { success: "Risk score updated." };
}

export async function assignRiskOwnerAction(
  riskId: string,
  ownerUserId: string,
): Promise<RiskActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "risks.write");
  if (denied) {
    return denied;
  }

  const editable = assertEditableRisk(session, await getRiskById(session, riskId));
  if (editable.kind === "error") {
    return editable.state;
  }
  const existing = editable.risk;

  if (!(await verifyUserInOrg(session.organization.id, ownerUserId))) {
    return { error: "Selected owner is not valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_risks")
    .update({ owner_user_id: ownerUserId } as never)
    .eq("id", riskId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: error.message };
  }

  await recordRiskActivity({
    organizationId: session.organization.id,
    riskId,
    actorUserId: session.user.id,
    eventType: "risk.assigned",
    message: `Risk assigned for ${existing.title}`,
    metadata: { ownerUserId },
  });

  revalidateRiskPaths(existing.client_id, riskId);
  return { success: "Risk owner updated." };
}

export async function acceptRiskAction(riskId: string): Promise<RiskActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "risks.write");
  if (denied) {
    return denied;
  }

  const editable = assertEditableRisk(session, await getRiskById(session, riskId));
  if (editable.kind === "error") {
    return editable.state;
  }
  const existing = editable.risk;

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_risks")
    .update({ accepted_at: new Date().toISOString() } as never)
    .eq("id", riskId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: error.message };
  }

  await recordRiskActivity({
    organizationId: session.organization.id,
    riskId,
    actorUserId: session.user.id,
    eventType: "risk.accepted",
    message: `Risk accepted: ${existing.title}`,
  });

  revalidateRiskPaths(existing.client_id, riskId);
  return { success: "Risk accepted." };
}

async function transitionRisk(
  riskId: string,
  status: ClientRiskUpdate["status"],
  eventType: RiskActivityEventType,
  actionLabel: string,
): Promise<RiskActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "risks.write");
  if (denied) {
    return denied;
  }

  const editable = assertEditableRisk(session, await getRiskById(session, riskId));
  if (editable.kind === "error") {
    return editable.state;
  }
  const existing = editable.risk;

  const supabase = await createClient();
  const resolvedAt =
    status === "resolved" || status === "dismissed" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("client_risks")
    .update({ status, resolved_at: resolvedAt } as never)
    .eq("id", riskId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: error.message };
  }

  await recordRiskActivity({
    organizationId: session.organization.id,
    riskId,
    actorUserId: session.user.id,
    eventType,
    message: `Risk ${actionLabel}: ${existing.title}`,
    metadata: { previousStatus: existing.status, status },
  });

  revalidateRiskPaths(existing.client_id, riskId);
  return { success: `Risk ${actionLabel}.` };
}

export async function acknowledgeRiskAction(riskId: string): Promise<RiskActionState> {
  return transitionRisk(riskId, "acknowledged", "risk.status_changed", "acknowledged");
}

export async function mitigateRiskAction(riskId: string): Promise<RiskActionState> {
  return transitionRisk(riskId, "mitigated", "risk.status_changed", "mitigated");
}

export async function resolveRiskAction(riskId: string): Promise<RiskActionState> {
  return transitionRisk(riskId, "resolved", "risk.resolved", "resolved");
}

export async function dismissRiskAction(riskId: string): Promise<RiskActionState> {
  return transitionRisk(riskId, "dismissed", "risk.dismissed", "dismissed");
}

/** @deprecated Use dismissRiskAction */
export async function archiveRiskAction(riskId: string): Promise<void> {
  const result = await dismissRiskAction(riskId);
  if (result.error) {
    throw new Error(result.error);
  }
  redirect("/risks");
}

export async function deleteRiskAction(riskId: string): Promise<RiskActionState> {
  const session = await requireSession();
  if (!sessionHasPermission(session, "risks.write") || !["owner", "admin"].includes(session.role)) {
    return { error: "You cannot delete risks." };
  }

  const existing = await getRiskById(session, riskId);
  if (!existing) {
    return { error: "Risk not found." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_risks")
    .delete()
    .eq("id", riskId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: error.message };
  }

  await recordRiskActivity({
    organizationId: session.organization.id,
    riskId,
    actorUserId: session.user.id,
    eventType: "risk.deleted",
    message: `Risk deleted: ${existing.title}`,
  });

  revalidateRiskPaths(existing.client_id);
  redirect("/risks");
}

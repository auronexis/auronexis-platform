"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { assertPermissionSafe, sessionHasPermission } from "@/lib/authorization/guards";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getRiskById } from "@/lib/risks/queries";
import type { Database } from "@/types/database";
import type { ActivityEventType } from "@/lib/activity/types";

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
  ownerUserId: z.string().uuid().optional().nullable(),
  dueAt: z
    .string()
    .optional()
    .transform((value) => (!value || value.trim().length === 0 ? null : value)),
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
    ownerUserId: formData.get("ownerUserId") || undefined,
    dueAt: formData.get("dueAt"),
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

async function recordRiskActivity(
  organizationId: string,
  actorUserId: string,
  riskId: string,
  eventType: ActivityEventType,
  title: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await recordActivityEvent({
      organizationId,
      actorUserId,
      entityType: "risk",
      entityId: riskId,
      eventType,
      action: eventType.split(".")[1] ?? "updated",
      title,
      metadata,
    });
  } catch (error) {
    console.warn("[risks] activity recording failed:", error);
  }
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
    severity: parsed.data.severity,
    status: "open",
    source: parsed.data.source ?? "manual",
    category: parsed.data.category ?? null,
    impact: parsed.data.impact ?? null,
    recommendation: parsed.data.recommendation ?? null,
    owner_user_id: ownerUserId,
    due_at: parsed.data.dueAt,
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
  await recordRiskActivity(
    session.organization.id,
    session.user.id,
    riskId,
    "risk.created",
    `Risk created: ${parsed.data.title}`,
  );

  revalidatePath("/risks");
  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath("/dashboard");
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

  const existing = await getRiskById(session, riskId);
  if (!existing) {
    return { error: "Risk not found." };
  }

  const parsed = parseRiskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid risk data." };
  }

  const ownerUserId = parsed.data.ownerUserId ?? existing.owner_user_id ?? session.user.id;

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
    severity: parsed.data.severity,
    category: parsed.data.category ?? null,
    impact: parsed.data.impact ?? null,
    recommendation: parsed.data.recommendation ?? null,
    owner_user_id: ownerUserId,
    due_at: parsed.data.dueAt,
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

  await recordRiskActivity(
    session.organization.id,
    session.user.id,
    riskId,
    "risk.updated",
    `Risk updated: ${parsed.data.title}`,
  );

  revalidatePath("/risks");
  revalidatePath(`/risks/${riskId}`);
  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath("/dashboard");
  return { success: "Risk updated." };
}

async function transitionRisk(
  riskId: string,
  status: ClientRiskUpdate["status"],
  eventType: ActivityEventType,
  actionLabel: string,
): Promise<RiskActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "risks.write");
  if (denied) {
    return denied;
  }

  const existing = await getRiskById(session, riskId);
  if (!existing) {
    return { error: "Risk not found." };
  }

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

  await recordRiskActivity(
    session.organization.id,
    session.user.id,
    riskId,
    eventType,
    `Risk ${actionLabel}: ${existing.title}`,
  );

  revalidatePath("/risks");
  revalidatePath(`/risks/${riskId}`);
  revalidatePath(`/clients/${existing.client_id}`);
  revalidatePath("/dashboard");
  return { success: `Risk ${actionLabel}.` };
}

export async function acknowledgeRiskAction(riskId: string): Promise<RiskActionState> {
  return transitionRisk(riskId, "acknowledged", "risk.acknowledged", "acknowledged");
}

export async function mitigateRiskAction(riskId: string): Promise<RiskActionState> {
  return transitionRisk(riskId, "mitigated", "risk.mitigated", "mitigated");
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

  await recordRiskActivity(
    session.organization.id,
    session.user.id,
    riskId,
    "risk.deleted",
    `Risk deleted: ${existing.title}`,
  );

  revalidatePath("/risks");
  revalidatePath("/dashboard");
  redirect("/risks");
}

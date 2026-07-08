"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { requireSession } from "@/lib/auth/session";
import { checkPlanFeatureSafe } from "@/lib/action-errors";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { getEscalationRuleById } from "@/lib/escalation/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type EscalationRuleInsert = Database["public"]["Tables"]["escalation_rules"]["Insert"];
type EscalationRuleUpdate = Database["public"]["Tables"]["escalation_rules"]["Update"];

export type EscalationRuleActionState = {
  error?: string;
  success?: string;
};

const escalationRuleSchema = z.object({
  name: z.string().trim().min(2, "Rule name is required."),
  triggerType: z.enum([
    "sla_warning",
    "sla_breached",
    "critical_risk",
    "critical_incident",
    "report_overdue",
  ]),
  severity: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .optional(),
  delayMinutes: z.coerce.number().int().min(0, "Delay must be zero or greater."),
  notifyOwner: z.boolean(),
  notifyAssignedUser: z.boolean(),
  createActivity: z.boolean(),
  createNotification: z.boolean(),
  enabled: z.boolean(),
});

function parseEscalationRuleForm(formData: FormData) {
  return escalationRuleSchema.safeParse({
    name: formData.get("name"),
    triggerType: formData.get("triggerType"),
    severity: formData.get("severity"),
    delayMinutes: formData.get("delayMinutes") ?? "0",
    notifyOwner: formData.get("notifyOwner") === "on",
    notifyAssignedUser: formData.get("notifyAssignedUser") === "on",
    createActivity: formData.get("createActivity") === "on",
    createNotification: formData.get("createNotification") === "on",
    enabled: formData.get("enabled") === "on",
  });
}

function buildEscalationRulePayload(parsed: z.infer<typeof escalationRuleSchema>) {
  return {
    name: parsed.name,
    trigger_type: parsed.triggerType,
    severity: parsed.severity ?? null,
    delay_minutes: parsed.delayMinutes,
    notify_owner: parsed.notifyOwner,
    notify_assigned_user: parsed.notifyAssignedUser,
    create_activity: parsed.createActivity,
    create_notification: parsed.createNotification,
    enabled: parsed.enabled,
  };
}

/** Create an escalation rule — Owner/Admin only. */
export async function createEscalationRuleAction(
  _prevState: EscalationRuleActionState,
  formData: FormData,
): Promise<EscalationRuleActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const planError = await checkPlanFeatureSafe(session.organization.id, "escalation_rules");
  if (planError) {
    return planError;
  }

  const parsed = parseEscalationRuleForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid escalation rule data." };
  }

  const supabase = await createClient();
  const insertPayload: EscalationRuleInsert = {
    organization_id: session.organization.id,
    ...buildEscalationRulePayload(parsed.data),
  };

  const { data, error } = await supabase
    .from("escalation_rules")
    .insert(insertPayload as never)
    .select("id")
    .single();

  const created = data as { id: string } | null;

  if (error || !created) {
    return { error: "Unable to create escalation rule." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    action: "escalation_rule_created",
    title: `Escalation rule created: ${parsed.data.name}`,
    metadata: { ruleId: created.id, name: parsed.data.name },
  });

  revalidatePath("/settings/escalation");
  redirect(`/settings/escalation/${created.id}`);
}

/** Update an escalation rule — Owner/Admin only. */
export async function updateEscalationRuleAction(
  ruleId: string,
  _prevState: EscalationRuleActionState,
  formData: FormData,
): Promise<EscalationRuleActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const planError = await checkPlanFeatureSafe(session.organization.id, "escalation_rules");
  if (planError) {
    return planError;
  }

  const existing = await getEscalationRuleById(session, ruleId);

  if (!existing) {
    return { error: "Escalation rule not found." };
  }

  const parsed = parseEscalationRuleForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid escalation rule data." };
  }

  const supabase = await createClient();
  const updatePayload: EscalationRuleUpdate = buildEscalationRulePayload(parsed.data);

  const { error } = await supabase
    .from("escalation_rules")
    .update(updatePayload as never)
    .eq("id", ruleId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update escalation rule." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    action: "escalation_rule_updated",
    title: `Escalation rule updated: ${parsed.data.name}`,
    metadata: { ruleId, name: parsed.data.name },
  });

  revalidatePath("/settings/escalation");
  revalidatePath(`/settings/escalation/${ruleId}`);
  revalidatePath("/dashboard");

  return { success: "Escalation rule saved." };
}

/** Delete an escalation rule — Owner/Admin only. */
export async function deleteEscalationRuleAction(ruleId: string): Promise<EscalationRuleActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const planError = await checkPlanFeatureSafe(session.organization.id, "escalation_rules");
  if (planError) {
    return planError;
  }

  const existing = await getEscalationRuleById(session, ruleId);

  if (!existing) {
    return { error: "Escalation rule not found." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("escalation_rules")
    .delete()
    .eq("id", ruleId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to delete escalation rule." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    action: "escalation_rule_deleted",
    title: `Escalation rule deleted: ${existing.name}`,
    metadata: { ruleId, name: existing.name },
  });

  revalidatePath("/settings/escalation");
  revalidatePath("/dashboard");
  redirect("/settings/escalation");
}

/** Toggle escalation rule enabled state — Owner/Admin only. */
export async function toggleEscalationRuleAction(
  ruleId: string,
  enabled: boolean,
): Promise<EscalationRuleActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const planError = await checkPlanFeatureSafe(session.organization.id, "escalation_rules");
  if (planError) {
    return planError;
  }

  const existing = await getEscalationRuleById(session, ruleId);

  if (!existing) {
    return { error: "Escalation rule not found." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("escalation_rules")
    .update({ enabled } as never)
    .eq("id", ruleId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update escalation rule." };
  }

  revalidatePath("/settings/escalation");
  revalidatePath(`/settings/escalation/${ruleId}`);
  revalidatePath("/dashboard");

  return { success: enabled ? "Escalation rule enabled." : "Escalation rule disabled." };
}

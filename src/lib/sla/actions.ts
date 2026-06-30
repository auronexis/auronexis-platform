"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { canManageSlaPolicies } from "@/lib/team/guards";
import { getSlaPolicyById } from "@/lib/sla/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SlaPolicyInsert = Database["public"]["Tables"]["sla_policies"]["Insert"];
type SlaPolicyUpdate = Database["public"]["Tables"]["sla_policies"]["Update"];

export type SlaPolicyActionState = {
  error?: string;
  success?: string;
};

const optionalHours = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : Number(value)))
  .nullable()
  .optional()
  .refine((value) => value === null || value === undefined || (Number.isInteger(value) && value > 0), {
    message: "Enter a valid number of hours.",
  });

const slaPolicySchema = z.object({
  name: z.string().trim().min(2, "Policy name is required."),
  incidentHours: optionalHours,
  riskHours: optionalHours,
});

function parseSlaPolicyForm(formData: FormData) {
  return slaPolicySchema.safeParse({
    name: formData.get("name"),
    incidentHours: formData.get("incidentHours"),
    riskHours: formData.get("riskHours"),
  });
}

function buildSlaPolicyPayload(parsed: z.infer<typeof slaPolicySchema>) {
  if (!parsed.incidentHours && !parsed.riskHours) {
    return null;
  }

  return {
    name: parsed.name,
    incident_hours: parsed.incidentHours ?? null,
    risk_hours: parsed.riskHours ?? null,
  };
}

async function clearDefaultSlaPolicy(organizationId: string, exceptPolicyId?: string): Promise<void> {
  const supabase = await createClient();
  let query = supabase
    .from("sla_policies")
    .update({ is_default: false } as never)
    .eq("organization_id", organizationId)
    .eq("is_default", true);

  if (exceptPolicyId) {
    query = query.neq("id", exceptPolicyId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}

/** Create an SLA policy — Owner/Admin only. */
export async function createSlaPolicyAction(
  _prevState: SlaPolicyActionState,
  formData: FormData,
): Promise<SlaPolicyActionState> {
  const session = await requireSession();

  if (!canManageSlaPolicies(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  await assertCanUseFeature(session.organization.id, "sla_tracking");

  const parsed = parseSlaPolicyForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid SLA policy data." };
  }

  const payload = buildSlaPolicyPayload(parsed.data);

  if (!payload) {
    return { error: "Set at least one response time (incident or risk hours)." };
  }

  const supabase = await createClient();
  const insertPayload: SlaPolicyInsert = {
    organization_id: session.organization.id,
    is_default: false,
    ...payload,
  };

  const { data, error } = await supabase
    .from("sla_policies")
    .insert(insertPayload as never)
    .select("id")
    .single();

  const created = data as { id: string } | null;

  if (error || !created) {
    return { error: "Unable to create SLA policy." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    action: "sla_policy_created",
    title: `SLA policy created: ${parsed.data.name}`,
    metadata: { policyId: created.id, name: parsed.data.name },
  });

  revalidatePath("/settings/sla");
  redirect(`/settings/sla/${created.id}`);
}

/** Update an SLA policy — Owner/Admin only. */
export async function updateSlaPolicyAction(
  policyId: string,
  _prevState: SlaPolicyActionState,
  formData: FormData,
): Promise<SlaPolicyActionState> {
  const session = await requireSession();

  if (!canManageSlaPolicies(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  await assertCanUseFeature(session.organization.id, "sla_tracking");

  const existing = await getSlaPolicyById(session, policyId);

  if (!existing) {
    return { error: "SLA policy not found." };
  }

  const parsed = parseSlaPolicyForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid SLA policy data." };
  }

  const payload = buildSlaPolicyPayload(parsed.data);

  if (!payload) {
    return { error: "Set at least one response time (incident or risk hours)." };
  }

  const supabase = await createClient();
  const updatePayload: SlaPolicyUpdate = payload;

  const { error } = await supabase
    .from("sla_policies")
    .update(updatePayload as never)
    .eq("id", policyId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update SLA policy." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    action: "sla_policy_updated",
    title: `SLA policy updated: ${parsed.data.name}`,
    metadata: { policyId, name: parsed.data.name },
  });

  revalidatePath("/settings/sla");
  revalidatePath(`/settings/sla/${policyId}`);
  revalidatePath("/dashboard");

  return { success: "SLA policy saved." };
}

/** Delete an SLA policy — Owner/Admin only. */
export async function deleteSlaPolicyAction(policyId: string): Promise<SlaPolicyActionState> {
  const session = await requireSession();

  if (!canManageSlaPolicies(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  await assertCanUseFeature(session.organization.id, "sla_tracking");

  const existing = await getSlaPolicyById(session, policyId);

  if (!existing) {
    return { error: "SLA policy not found." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("sla_policies")
    .delete()
    .eq("id", policyId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to delete SLA policy." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    action: "sla_policy_deleted",
    title: `SLA policy deleted: ${existing.name}`,
    metadata: { policyId, name: existing.name },
  });

  revalidatePath("/settings/sla");
  revalidatePath("/dashboard");
  redirect("/settings/sla");
}

/** Set an SLA policy as the organization default — Owner/Admin only. */
export async function setDefaultSlaPolicyAction(policyId: string): Promise<SlaPolicyActionState> {
  const session = await requireSession();

  if (!canManageSlaPolicies(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  await assertCanUseFeature(session.organization.id, "sla_tracking");

  const existing = await getSlaPolicyById(session, policyId);

  if (!existing) {
    return { error: "SLA policy not found." };
  }

  await clearDefaultSlaPolicy(session.organization.id, policyId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("sla_policies")
    .update({ is_default: true } as never)
    .eq("id", policyId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to set default SLA policy." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    action: "sla_policy_default_set",
    title: `Default SLA policy set: ${existing.name}`,
    metadata: { policyId, name: existing.name },
  });

  revalidatePath("/settings/sla");
  revalidatePath(`/settings/sla/${policyId}`);
  revalidatePath("/dashboard");
  revalidatePath("/clients");

  return { success: "Default SLA policy updated." };
}

/** Assign an SLA policy to a client — Owner/Admin only. */
export async function assignClientSlaPolicyAction(
  clientId: string,
  _prevState: SlaPolicyActionState,
  formData: FormData,
): Promise<SlaPolicyActionState> {
  const session = await requireSession();

  if (!canManageSlaPolicies(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  await assertCanUseFeature(session.organization.id, "sla_tracking");

  const policyIdRaw = formData.get("slaPolicyId");
  const slaPolicyId =
    typeof policyIdRaw === "string" && policyIdRaw.trim().length > 0 ? policyIdRaw.trim() : null;

  if (slaPolicyId) {
    const policy = await getSlaPolicyById(session, slaPolicyId);

    if (!policy) {
      return { error: "SLA policy not found." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ sla_policy_id: slaPolicyId } as never)
    .eq("id", clientId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update client SLA policy." };
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "client",
    entityId: clientId,
    action: "client_sla_policy_updated",
    title: "Client SLA policy updated",
    metadata: { clientId, slaPolicyId },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");

  return { success: "Client SLA policy saved." };
}

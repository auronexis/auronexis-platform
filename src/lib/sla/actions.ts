"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { assertCanUseFeature, checkPlanFeature } from "@/lib/plans/guards";
import { AuthorizationError } from "@/lib/rbac/guards";
import { canManageSlaPolicies } from "@/lib/team/guards";
import { recordSLAActivity } from "@/lib/sla/activity";
import { dispatchWebhookEvent } from "@/lib/webhooks/events";
import {
  getDefaultSlaPolicy,
  getSlaEventByIncidentId,
  getSlaPolicyById,
} from "@/lib/sla/queries";
import { calculateSLA, deriveEventBreached } from "@/lib/sla/timers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, IncidentSeverity } from "@/types/database";

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
    eventType: "sla.created",
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
    eventType: "sla.updated",
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
    eventType: "sla.deleted",
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
    eventType: "sla.updated",
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
  try {
    const session = await requireSession();

    if (!canManageSlaPolicies(session)) {
      return { error: ACTION_DENIED_MESSAGE };
    }

    const slaAccess = await checkPlanFeature(session.organization.id, "sla_tracking");
    if (!slaAccess.allowed) {
      return { error: "SLA assignment is available on the Business plan." };
    }

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
      eventType: "sla.updated",
      action: "client_sla_policy_updated",
      title: "Client SLA policy updated",
      metadata: { clientId, slaPolicyId },
    });

    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/dashboard");

    return { success: "Client SLA policy saved." };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        error: error.message || "SLA assignment is available on the Business plan.",
      };
    }

    console.error("[sla] assignClientSlaPolicyAction failed:", error);
    return { error: "Unable to save SLA assignment." };
  }
}

type AssignSlaToIncidentInput = {
  organizationId: string;
  incidentId: string;
  clientId: string;
  severity: IncidentSeverity;
  actorUserId: string | null;
  startedAt: string;
};

/** Create SLA event for a new incident — idempotent, never throws. */
export async function assignSLAToIncident(input: AssignSlaToIncidentInput): Promise<void> {
  try {
    const existing = await getSlaEventByIncidentId(input.organizationId, input.incidentId);
    if (existing) {
      return;
    }

    const admin = createAdminClient();
    const { data: clientRow } = await admin
      .from("clients")
      .select("sla_policy_id")
      .eq("organization_id", input.organizationId)
      .eq("id", input.clientId)
      .maybeSingle();

    const clientPolicyId = (clientRow as { sla_policy_id: string | null } | null)?.sla_policy_id ?? null;
    const defaultPolicy = await getDefaultSlaPolicy(input.organizationId);
    let policy = defaultPolicy;

    if (clientPolicyId) {
      const { data: assignedPolicy } = await admin
        .from("sla_policies")
        .select("*")
        .eq("organization_id", input.organizationId)
        .eq("id", clientPolicyId)
        .maybeSingle();
      policy = (assignedPolicy as typeof defaultPolicy) ?? defaultPolicy;
    }

    const calculated = calculateSLA({
      policy,
      severity: input.severity,
      startedAt: input.startedAt,
    });

    const { data, error } = await admin
      .from("sla_events")
      .insert({
        organization_id: input.organizationId,
        incident_id: input.incidentId,
        client_id: input.clientId,
        policy_id: policy?.id ?? null,
        status: "active",
        breached: false,
        started_at: calculated.startedAt.toISOString(),
        response_due_at: calculated.responseDueAt.toISOString(),
        resolution_due_at: calculated.resolutionDueAt.toISOString(),
      } as never)
      .select("id")
      .single();

    if (error) {
      console.warn("[sla] assignSLAToIncident insert failed:", error.message);
      return;
    }

    const eventId = (data as { id: string }).id;
    await recordSLAActivity({
      organizationId: input.organizationId,
      eventType: "sla.created",
      actorUserId: input.actorUserId,
      incidentId: input.incidentId,
      message: "SLA event created for incident",
      metadata: { eventId, policyId: policy?.id, severity: input.severity },
    });
    await recordSLAActivity({
      organizationId: input.organizationId,
      eventType: "sla.started",
      actorUserId: input.actorUserId,
      incidentId: input.incidentId,
      message: "SLA timer started",
      metadata: { eventId },
    });

    if (policy) {
      await recordSLAActivity({
        organizationId: input.organizationId,
        eventType: "sla.policy_assigned",
        actorUserId: input.actorUserId,
        incidentId: input.incidentId,
        message: `SLA policy assigned: ${policy.name}`,
        metadata: { eventId, policyId: policy.id, policyName: policy.name },
      });
    }
  } catch (error) {
    console.warn("[sla] assignSLAToIncident failed:", error);
  }
}

/** Mark first response on an incident SLA event. */
export async function markSlaRespondedForIncident(input: {
  organizationId: string;
  incidentId: string;
  actorUserId: string | null;
  respondedAt?: string;
}): Promise<void> {
  try {
    const event = await getSlaEventByIncidentId(input.organizationId, input.incidentId);
    if (!event || event.responded_at) {
      return;
    }

    const respondedAt = input.respondedAt ?? new Date().toISOString();
    const breached = deriveEventBreached({
      ...event,
      responded_at: respondedAt,
    });

    const admin = createAdminClient();
    await admin
      .from("sla_events")
      .update({
        responded_at: respondedAt,
        status: "responded",
        breached,
      } as never)
      .eq("id", event.id)
      .eq("organization_id", input.organizationId);

    await recordSLAActivity({
      organizationId: input.organizationId,
      eventType: breached ? "sla.breached" : "sla.responded",
      actorUserId: input.actorUserId,
      incidentId: input.incidentId,
      message: breached ? "SLA response target breached" : "SLA response recorded",
      metadata: { eventId: event.id, respondedAt },
    });
  } catch (error) {
    console.warn("[sla] markSlaRespondedForIncident failed:", error);
  }
}

/** Finalize SLA when an incident is resolved. */
export async function completeSlaForIncident(input: {
  organizationId: string;
  incidentId: string;
  actorUserId: string | null;
  resolvedAt?: string;
}): Promise<void> {
  try {
    const event = await getSlaEventByIncidentId(input.organizationId, input.incidentId);
    if (!event || event.resolved_at) {
      return;
    }

    const resolvedAt = input.resolvedAt ?? new Date().toISOString();
    const breached = deriveEventBreached({
      ...event,
      resolved_at: resolvedAt,
    });

    const admin = createAdminClient();
    await admin
      .from("sla_events")
      .update({
        resolved_at: resolvedAt,
        status: "completed",
        breached,
      } as never)
      .eq("id", event.id)
      .eq("organization_id", input.organizationId);

    await recordSLAActivity({
      organizationId: input.organizationId,
      eventType: "sla.resolved",
      actorUserId: input.actorUserId,
      incidentId: input.incidentId,
      message: "SLA resolution recorded",
      metadata: { eventId: event.id, resolvedAt, breached },
    });
    await recordSLAActivity({
      organizationId: input.organizationId,
      eventType: "sla.completed",
      actorUserId: input.actorUserId,
      incidentId: input.incidentId,
      message: breached ? "SLA completed with breach" : "SLA completed within targets",
      metadata: { eventId: event.id, breached },
    });

    if (breached) {
      await recordSLAActivity({
        organizationId: input.organizationId,
        eventType: "sla.breached",
        actorUserId: input.actorUserId,
        incidentId: input.incidentId,
        message: "SLA resolution target breached",
        metadata: { eventId: event.id },
      });

      void dispatchWebhookEvent({
        organizationId: input.organizationId,
        eventType: "sla.breached",
        payload: {
          incidentId: input.incidentId,
          clientId: event.client_id,
          eventId: event.id,
        },
      }).catch(() => undefined);
    }
  } catch (error) {
    console.warn("[sla] completeSlaForIncident failed:", error);
  }
}

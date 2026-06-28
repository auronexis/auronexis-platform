import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_RULES = [
  {
    name: "Critical Incident",
    trigger_type: "critical_incident",
    notify_owner: true,
    notify_assigned_user: true,
  },
  {
    name: "Critical Risk",
    trigger_type: "critical_risk",
    notify_owner: true,
    notify_assigned_user: true,
  },
  {
    name: "SLA Breached",
    trigger_type: "sla_breached",
    notify_owner: true,
    notify_assigned_user: false,
  },
] as const;

/** Ensure default escalation rules exist for an organization (idempotent). */
export async function ensureDefaultEscalationRules(organizationId: string): Promise<void> {
  const admin = createAdminClient();

  for (const rule of DEFAULT_RULES) {
    const { count, error: countError } = await admin
      .from("escalation_rules")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("trigger_type", rule.trigger_type)
      .eq("name", rule.name);

    if (countError) {
      console.error("[escalation] default rule lookup failed:", countError.message);
      continue;
    }

    if ((count ?? 0) > 0) {
      continue;
    }

    const { error } = await admin.from("escalation_rules").insert({
      organization_id: organizationId,
      name: rule.name,
      trigger_type: rule.trigger_type,
      notify_owner: rule.notify_owner,
      notify_assigned_user: rule.notify_assigned_user,
      create_activity: true,
      create_notification: true,
      enabled: true,
    } as never);

    if (error) {
      console.error("[escalation] default rule insert failed:", error.message);
    }
  }
}

import { processEscalationRules } from "@/lib/escalation/engine";
import type { EscalationContext } from "@/lib/escalation/types";
import { createAdminClient } from "@/lib/supabase/admin";

type OverdueScheduleRow = {
  id: string;
  organization_id: string;
  client_id: string;
  title_template: string;
  next_run_at: string | null;
  assigned_user_id: string | null;
  clients: { name: string } | null;
};

/** Evaluate overdue report schedules and fire report_overdue escalation rules. */
export async function processOrganizationReportOverdueEscalations(
  organizationId: string,
): Promise<void> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await admin
    .from("report_schedules")
    .select(
      "id, organization_id, client_id, title_template, next_run_at, assigned_user_id, clients ( name )",
    )
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .not("next_run_at", "is", null)
    .lt("next_run_at", today);

  if (error) {
    console.error("[escalation] overdue schedule lookup failed:", error.message);
    return;
  }

  const schedules = (data ?? []) as OverdueScheduleRow[];

  for (const schedule of schedules) {
    const triggerAt = schedule.next_run_at
      ? new Date(`${schedule.next_run_at}T00:00:00`)
      : new Date();

    const context: EscalationContext = {
      organizationId,
      triggerType: "report_overdue",
      entityType: "report",
      entityId: schedule.id,
      clientId: schedule.client_id,
      clientName: schedule.clients?.name ?? undefined,
      title: schedule.title_template,
      assignedUserId: schedule.assigned_user_id,
      triggerAt,
    };

    await processEscalationRules(context);
  }
}

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { PostgrestError } from "@supabase/supabase-js";
import type {
  ClientSuccessPlaybookInstance,
  ClientSuccessTask,
  PlaybookInstanceStatus,
} from "@/lib/customer-success/types";
import { getPlaybookName } from "@/lib/customer-success/playbook-engine";

export type PlaybookInstanceRow =
  Database["public"]["Tables"]["customer_success_playbook_instances"]["Row"];

export type SuccessTaskRow = Database["public"]["Tables"]["customer_success_tasks"]["Row"];

function logCsError(
  operation: string,
  organizationId: string,
  error: PostgrestError,
  extra?: Record<string, string | undefined>,
): void {
  console.error("[customer_success]", {
    operation,
    organization_id: organizationId,
    ...extra,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export async function listPlaybookInstancesForOrg(
  organizationId: string,
  clientId?: string,
): Promise<PlaybookInstanceRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("customer_success_playbook_instances")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  if (error) {
    logCsError("list_playbook_instances", organizationId, error, { client_id: clientId });
    return [];
  }
  return (data ?? []) as PlaybookInstanceRow[];
}

export async function listTasksForOrg(
  organizationId: string,
  clientId?: string,
): Promise<SuccessTaskRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("customer_success_tasks")
    .select("*")
    .eq("organization_id", organizationId)
    .order("due_at", { ascending: true, nullsFirst: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  if (error) {
    logCsError("list_tasks", organizationId, error, { client_id: clientId });
    return [];
  }
  return (data ?? []) as SuccessTaskRow[];
}

export async function listTasksForPlaybook(
  organizationId: string,
  playbookInstanceId: string,
): Promise<SuccessTaskRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_success_tasks")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("playbook_instance_id", playbookInstanceId);

  if (error) {
    logCsError("list_playbook_tasks", organizationId, error, { playbook_instance_id: playbookInstanceId });
    return [];
  }
  return (data ?? []) as SuccessTaskRow[];
}

function isOverdue(dueAt: string | null, status: string): boolean {
  if (!dueAt || status === "completed" || status === "cancelled" || status === "skipped") {
    return false;
  }
  return new Date(dueAt) < new Date();
}

export function mapPlaybookInstance(
  row: PlaybookInstanceRow,
  tasks: SuccessTaskRow[],
): ClientSuccessPlaybookInstance {
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter((t) => isOverdue(t.due_at, t.status)).length;
  return {
    id: row.id,
    playbookKey: row.playbook_key,
    name: getPlaybookName(row.playbook_key),
    status: row.status as PlaybookInstanceStatus,
    priority: row.priority as ClientSuccessPlaybookInstance["priority"],
    assignedToUserId: row.assigned_to_user_id,
    startedAt: row.started_at,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    triggerCode: row.trigger_code,
    taskCount: tasks.length,
    completedTaskCount: completed,
    overdueTaskCount: overdue,
  };
}

export function mapTask(row: SuccessTaskRow): ClientSuccessTask {
  return {
    id: row.id,
    playbookInstanceId: row.playbook_instance_id,
    taskKey: row.task_key,
    title: row.title,
    description: row.description,
    status: row.status as ClientSuccessTask["status"],
    required: row.required,
    assignedToUserId: row.assigned_to_user_id,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    isOverdue: isOverdue(row.due_at, row.status),
  };
}

export async function countClientRisks(
  organizationId: string,
  clientId: string,
): Promise<{ open: number; critical: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_risks")
    .select("severity, status")
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .in("status", ["open", "acknowledged", "mitigated"]);

  if (error || !data) {
    return { open: 0, critical: 0 };
  }
  const rows = data as { severity: string; status: string }[];
  return {
    open: rows.length,
    critical: rows.filter((r) => r.severity === "critical").length,
  };
}

export async function countClientIncidents(
  organizationId: string,
  clientId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .in("status", ["open", "investigating"]);

  if (error) return 0;
  return count ?? 0;
}

export async function getPlaybookInstanceById(
  organizationId: string,
  instanceId: string,
): Promise<PlaybookInstanceRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_success_playbook_instances")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", instanceId)
    .maybeSingle();

  if (error || !data) return null;
  return data as PlaybookInstanceRow;
}

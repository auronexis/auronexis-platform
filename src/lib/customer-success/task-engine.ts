import { getPlaybookDefinition } from "@/lib/customer-success/constants";
import type { PlaybookInstanceRow, SuccessTaskRow } from "@/lib/customer-success/queries";
import type { Database } from "@/types/database";

export type PlaybookInsert =
  Database["public"]["Tables"]["customer_success_playbook_instances"]["Insert"];

export type TaskInsert = Database["public"]["Tables"]["customer_success_tasks"]["Insert"];

export function buildTaskRowsFromPlaybook(
  instance: PlaybookInstanceRow,
  startedAt: Date = new Date(instance.started_at),
): TaskInsert[] {
  const definition = getPlaybookDefinition(instance.playbook_key);
  if (!definition) return [];

  return definition.tasks.map((template) => {
    const due = new Date(startedAt);
    due.setUTCDate(due.getUTCDate() + template.offsetDays);
    return {
      organization_id: instance.organization_id,
      client_id: instance.client_id,
      playbook_instance_id: instance.id,
      task_key: template.key,
      title: template.title,
      description: template.description,
      status: "open",
      required: template.required,
      due_at: due.toISOString(),
    };
  });
}

export function computePlaybookDueAt(
  playbookKey: string,
  startedAt: Date = new Date(),
): string {
  const definition = getPlaybookDefinition(playbookKey);
  const days = definition?.estimatedDurationDays ?? 14;
  const due = new Date(startedAt);
  due.setUTCDate(due.getUTCDate() + days);
  return due.toISOString();
}

export function countOverdueTasks(tasks: SuccessTaskRow[]): number {
  const now = new Date();
  return tasks.filter(
    (t) =>
      t.due_at &&
      new Date(t.due_at) < now &&
      !["completed", "cancelled", "skipped"].includes(t.status),
  ).length;
}

export function allRequiredTasksComplete(tasks: SuccessTaskRow[]): boolean {
  const required = tasks.filter((t) => t.required);
  if (required.length === 0) return true;
  return required.every((t) => t.status === "completed");
}

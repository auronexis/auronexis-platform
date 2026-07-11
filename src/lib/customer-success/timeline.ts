import type { CustomerSuccessTimelineEvent } from "@/lib/customer-success/types";
import type { PlaybookInstanceRow, SuccessTaskRow } from "@/lib/customer-success/queries";
import type { ActivityEventView } from "@/lib/activity/types";
import { getPlaybookName } from "@/lib/customer-success/playbook-engine";

const TIMELINE_ACTIVITY_TYPES = new Set([
  "report.published",
  "risk.created",
  "risk.resolved",
  "incident.created",
  "incident.resolved",
  "monitoring.connector_recovered",
]);

type TimelineInput = {
  playbooks: PlaybookInstanceRow[];
  tasks: SuccessTaskRow[];
  activity: ActivityEventView[];
  limit?: number;
};

export function buildClientSuccessTimeline(input: TimelineInput): CustomerSuccessTimelineEvent[] {
  const events: CustomerSuccessTimelineEvent[] = [];

  for (const pb of input.playbooks) {
    events.push({
      id: `pb-start-${pb.id}`,
      type: "playbook_started",
      label: "Playbook started",
      description: `${getPlaybookName(pb.playbook_key)} intervention began.`,
      occurredAt: pb.started_at,
      source: "customer_success",
    });
    if (pb.completed_at) {
      events.push({
        id: `pb-complete-${pb.id}`,
        type: "playbook_completed",
        label: "Playbook completed",
        description: `${getPlaybookName(pb.playbook_key)} marked complete.`,
        occurredAt: pb.completed_at,
        source: "customer_success",
      });
    }
    if (pb.cancelled_at) {
      events.push({
        id: `pb-cancel-${pb.id}`,
        type: "playbook_cancelled",
        label: "Playbook cancelled",
        description: `${getPlaybookName(pb.playbook_key)} was cancelled.`,
        occurredAt: pb.cancelled_at,
        source: "customer_success",
      });
    }
  }

  for (const task of input.tasks) {
    if (task.completed_at) {
      events.push({
        id: `task-complete-${task.id}`,
        type: "task_completed",
        label: "Task completed",
        description: task.title,
        occurredAt: task.completed_at,
        source: "customer_success",
      });
    }
  }

  for (const act of input.activity) {
    const eventType = act.event_type ?? act.action;
    if (!TIMELINE_ACTIVITY_TYPES.has(eventType)) continue;
    events.push({
      id: `act-${act.id}`,
      type: eventType,
      label: act.title,
      description: act.description ?? act.title,
      occurredAt: act.created_at,
      source: "activity_events",
    });
  }

  return events
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, input.limit ?? 30);
}

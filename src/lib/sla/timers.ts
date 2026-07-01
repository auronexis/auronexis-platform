import { calculateRemainingTime as calculateLegacyRemainingTime } from "@/lib/sla/calculations";
import { resolveSeverityTargets, type SlaSeverityTargets } from "@/lib/sla/policies";
import type { IncidentSeverity, SlaPolicy } from "@/types/database";
import type { SlaEventView, SlaTimerView } from "@/lib/sla/types";

const MS_PER_MINUTE = 60_000;

export type CalculatedSlaDueDates = {
  targets: SlaSeverityTargets;
  startedAt: Date;
  responseDueAt: Date;
  resolutionDueAt: Date;
};

/** Calculate response and resolution due timestamps from policy + severity. */
export function calculateSLA(input: {
  policy: SlaPolicy | null;
  severity: IncidentSeverity;
  startedAt: string | Date;
}): CalculatedSlaDueDates {
  const targets = resolveSeverityTargets(input.policy, input.severity);
  const startedAt = new Date(input.startedAt);

  return {
    targets,
    startedAt,
    responseDueAt: new Date(startedAt.getTime() + targets.responseMinutes * MS_PER_MINUTE),
    resolutionDueAt: new Date(startedAt.getTime() + targets.resolutionMinutes * MS_PER_MINUTE),
  };
}

export function calculateRemainingTime(
  dueAt: string | Date | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!dueAt) {
    return null;
  }

  return calculateLegacyRemainingTime(new Date(dueAt), now);
}

export function isSLABreached(
  dueAt: string | Date | null | undefined,
  resolvedAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!dueAt) {
    return false;
  }

  const compareAt = resolvedAt ? new Date(resolvedAt) : now;
  return compareAt.getTime() > new Date(dueAt).getTime();
}

export function buildSlaTimers(
  event: SlaEventView,
  now: Date = new Date(),
): SlaTimerView[] {
  const timers: SlaTimerView[] = [];

  if (event.response_due_at) {
    timers.push({
      kind: "response",
      label: "Response",
      dueAt: event.response_due_at,
      completedAt: event.responded_at,
      remainingLabel: calculateRemainingTime(event.response_due_at, now),
      breached: isSLABreached(event.response_due_at, event.responded_at, now),
    });
  }

  if (event.resolution_due_at) {
    timers.push({
      kind: "resolution",
      label: "Resolution",
      dueAt: event.resolution_due_at,
      completedAt: event.resolved_at,
      remainingLabel: calculateRemainingTime(event.resolution_due_at, now),
      breached: isSLABreached(event.resolution_due_at, event.resolved_at, now),
    });
  }

  return timers;
}

export function deriveEventBreached(event: SlaEventView, now: Date = new Date()): boolean {
  if (event.breached) {
    return true;
  }

  return (
    isSLABreached(event.response_due_at, event.responded_at, now) ||
    isSLABreached(event.resolution_due_at, event.resolved_at, now)
  );
}

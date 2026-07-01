import type { ClientRiskStatus, IncidentStatus, RiskStatus } from "@/types/database";
import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { LEGACY_OPEN_RISK_STATUSES, OPEN_RISK_STATUSES } from "@/lib/risks/types";
import type { SlaPolicy } from "@/types/database";
import type { EntitySlaInfo, SlaPolicySource } from "@/lib/sla/types";

export type SlaStatus = "on_track" | "warning" | "breached" | null;

export type SlaEntityType = "incident" | "risk";

const MS_PER_HOUR = 60 * 60 * 1000;

/** Compute SLA due timestamp from creation time and policy hours. */
export function calculateSlaDueDate(
  createdAt: string | Date,
  hours: number | null | undefined,
): Date | null {
  if (!hours || hours <= 0) {
    return null;
  }

  const start = new Date(createdAt);
  return new Date(start.getTime() + hours * MS_PER_HOUR);
}

/** When SLA enters the warning window (25% time remaining). */
export function calculateSlaWarningAt(
  createdAt: string | Date,
  hours: number | null | undefined,
): Date | null {
  if (!hours || hours <= 0) {
    return null;
  }

  const start = new Date(createdAt);
  return new Date(start.getTime() + hours * 0.75 * MS_PER_HOUR);
}

/** Derive SLA status from due date and total policy duration. */
export function calculateSlaStatus(
  slaDueAt: Date | null,
  totalHours: number | null | undefined,
  now: Date = new Date(),
): SlaStatus {
  if (!slaDueAt || !totalHours || totalHours <= 0) {
    return null;
  }

  if (now.getTime() > slaDueAt.getTime()) {
    return "breached";
  }

  const totalMs = totalHours * MS_PER_HOUR;
  const remainingMs = slaDueAt.getTime() - now.getTime();
  const remainingPercent = (remainingMs / totalMs) * 100;

  if (remainingPercent <= 25) {
    return "warning";
  }

  return "on_track";
}

/** Human-readable remaining time until SLA due date. */
export function calculateRemainingTime(
  slaDueAt: Date | null,
  now: Date = new Date(),
): string | null {
  if (!slaDueAt) {
    return null;
  }

  const diffMs = slaDueAt.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Overdue";
  }

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}

export function formatSlaHours(hours: number | null | undefined): string {
  if (!hours) {
    return "—";
  }

  return `${hours}h`;
}

function resolvePolicyHours(
  entityType: SlaEntityType,
  policy: SlaPolicy | null | undefined,
): number | null {
  if (!policy) {
    return null;
  }

  if (entityType === "incident") {
    return policy.incident_hours;
  }

  return policy.risk_hours;
}

function isOpenEntityStatus(
  entityType: SlaEntityType,
  status: IncidentStatus | ClientRiskStatus | RiskStatus,
): boolean {
  if (entityType === "incident") {
    return OPEN_INCIDENT_STATUSES.includes(status as IncidentStatus);
  }

  if (LEGACY_OPEN_RISK_STATUSES.includes(status as RiskStatus)) {
    return true;
  }

  return OPEN_RISK_STATUSES.includes(status as ClientRiskStatus);
}

function resolvePolicySource(
  assignedPolicyId: string | null | undefined,
  policy: SlaPolicy | null | undefined,
): SlaPolicySource {
  if (!policy) {
    return "none";
  }

  if (assignedPolicyId) {
    return "assigned";
  }

  return "inherited";
}

/** Build resolved SLA info for an incident or risk row. */
export function resolveEntitySlaInfo(input: {
  entityType: SlaEntityType;
  createdAt: string;
  status: IncidentStatus | ClientRiskStatus | RiskStatus;
  policy: SlaPolicy | null | undefined;
  assignedPolicyId?: string | null;
  resolvedAt?: string | null;
  now?: Date;
}): EntitySlaInfo {
  const now = input.now ?? new Date();
  const policySource = resolvePolicySource(input.assignedPolicyId, input.policy);

  const base: EntitySlaInfo = {
    policyName: input.policy?.name ?? null,
    policySource,
    incidentHours: input.policy?.incident_hours ?? null,
    riskHours: input.policy?.risk_hours ?? null,
    slaDueAt: null,
    warningAt: null,
    createdAt: input.createdAt,
    resolvedAt: input.resolvedAt ?? null,
    status: null,
    remainingLabel: null,
    totalHours: null,
  };

  if (!isOpenEntityStatus(input.entityType, input.status)) {
    return base;
  }

  const totalHours = resolvePolicyHours(input.entityType, input.policy);

  if (!totalHours) {
    return base;
  }

  const slaDueAt = calculateSlaDueDate(input.createdAt, totalHours);
  const warningAt = calculateSlaWarningAt(input.createdAt, totalHours);
  const status = calculateSlaStatus(slaDueAt, totalHours, now);

  return {
    ...base,
    slaDueAt: slaDueAt?.toISOString() ?? null,
    warningAt: warningAt?.toISOString() ?? null,
    status,
    remainingLabel: calculateRemainingTime(slaDueAt, now),
    totalHours,
  };
}

export function formatSlaDueDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

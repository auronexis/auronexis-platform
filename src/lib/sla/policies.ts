import type { IncidentSeverity, SlaPolicy } from "@/types/database";

export type SlaSeverity = IncidentSeverity;

export type SlaSeverityTargets = {
  responseMinutes: number;
  resolutionMinutes: number;
};

export const DEFAULT_SEVERITY_TARGETS: Record<SlaSeverity, SlaSeverityTargets> = {
  critical: { responseMinutes: 15, resolutionMinutes: 240 },
  high: { responseMinutes: 30, resolutionMinutes: 480 },
  medium: { responseMinutes: 120, resolutionMinutes: 1440 },
  low: { responseMinutes: 240, resolutionMinutes: 4320 },
};

const SEVERITY_POLICY_FIELDS: Record<
  SlaSeverity,
  { response: keyof SlaPolicy; resolution: keyof SlaPolicy }
> = {
  critical: { response: "critical_response_minutes", resolution: "critical_resolution_minutes" },
  high: { response: "high_response_minutes", resolution: "high_resolution_minutes" },
  medium: { response: "medium_response_minutes", resolution: "medium_resolution_minutes" },
  low: { response: "low_response_minutes", resolution: "low_resolution_minutes" },
};

/** Resolve response/resolution targets for an incident severity and policy. */
export function resolveSeverityTargets(
  policy: SlaPolicy | null | undefined,
  severity: SlaSeverity,
): SlaSeverityTargets {
  const defaults = DEFAULT_SEVERITY_TARGETS[severity];
  if (!policy) {
    return defaults;
  }

  const fields = SEVERITY_POLICY_FIELDS[severity];
  const responseMinutes = Number(policy[fields.response]) || defaults.responseMinutes;
  const resolutionMinutes = Number(policy[fields.resolution]) || defaults.resolutionMinutes;

  if (!policy.incident_hours && responseMinutes === defaults.responseMinutes) {
    return defaults;
  }

  return {
    responseMinutes: Math.max(1, responseMinutes),
    resolutionMinutes: Math.max(responseMinutes, resolutionMinutes),
  };
}

/** Human-readable severity target label for portal and reports. */
export function formatSeverityTarget(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1)} h`;
  }

  const days = hours / 24;
  return Number.isInteger(days) ? `${days} d` : `${days.toFixed(1)} d`;
}

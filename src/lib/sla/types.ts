import type { SlaPolicy } from "@/types/database";
import type { SlaStatus } from "@/lib/sla/calculations";

export type SlaPolicyListItem = SlaPolicy;

export type SlaPolicySource = "assigned" | "inherited" | "none";

export type EntitySlaInfo = {
  policyName: string | null;
  policySource: SlaPolicySource;
  incidentHours: number | null;
  riskHours: number | null;
  slaDueAt: string | null;
  warningAt: string | null;
  createdAt: string | null;
  resolvedAt: string | null;
  status: SlaStatus;
  remainingLabel: string | null;
  totalHours: number | null;
};

export type ClientSlaAssignment = {
  assignedPolicyId: string | null;
  effectivePolicy: SlaPolicy | null;
  source: SlaPolicySource;
};

export type SlaBreachAlertItem = {
  entityType: "incident" | "risk";
  id: string;
  title: string;
  clientName: string | null;
  dueAt: string;
  status: SlaStatus;
  href: string;
};

export type SlaDashboardMetrics = {
  breachedCount: number;
  warningCount: number;
  onTrackCount: number;
  upcomingBreaches: SlaBreachAlertItem[];
  breachedItems: SlaBreachAlertItem[];
  compliancePercent: number;
  avgResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
  criticalBreaches: number;
  openTimers: number;
  monthlyTrend: SlaMonthlyTrendPoint[];
};

export type SlaMonthlyTrendPoint = {
  month: string;
  compliancePercent: number;
};

export type SlaComplianceMetrics = {
  breachedCount: number;
  compliancePercent: number;
  avgResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
  criticalBreaches: number;
  openTimers: number;
  monthlyTrend: SlaMonthlyTrendPoint[];
};

export type SlaEventView = {
  id: string;
  organization_id: string;
  incident_id: string | null;
  client_id: string | null;
  policy_id: string | null;
  status: string;
  breached: boolean;
  started_at: string | null;
  response_due_at: string | null;
  resolution_due_at: string | null;
  responded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SlaTimerView = {
  kind: "response" | "resolution";
  label: string;
  dueAt: string;
  completedAt: string | null;
  remainingLabel: string | null;
  breached: boolean;
};

export type SlaActivityView = {
  id: string;
  organization_id: string;
  event_type: string;
  actor_user_id: string | null;
  incident_id: string | null;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: { full_name: string } | null;
};

export type ClientSlaSummary = {
  policyName: string | null;
  compliancePercent: number;
  breachCount: number;
  avgResponseMinutes: number | null;
  avgResolutionMinutes: number | null;
  activeTimers: SlaTimerView[];
  recentActivity: SlaActivityView[];
  assignment: ClientSlaAssignment;
};

export type PortalSlaSummary = {
  policyName: string | null;
  compliancePercent: number;
  responseTarget: string;
  resolutionTarget: string;
  breachCount: number;
};

export type IncidentSlaView = {
  event: SlaEventView | null;
  timers: SlaTimerView[];
  policyName: string | null;
};

export const SLA_STATUS_LABELS: Record<Exclude<SlaStatus, null>, string> = {
  on_track: "On track",
  warning: "Warning",
  breached: "Breached",
};

/** Canonical PostgREST select for sla_policies rows. */
export const SLA_POLICY_SELECT =
  "id, organization_id, name, incident_hours, risk_hours, is_default, critical_response_minutes, critical_resolution_minutes, high_response_minutes, high_resolution_minutes, medium_response_minutes, medium_resolution_minutes, low_response_minutes, low_resolution_minutes, created_at, updated_at";

/** Canonical PostgREST select for sla_events rows. */
export const SLA_EVENT_SELECT = `
  id,
  organization_id,
  incident_id,
  client_id,
  policy_id,
  status,
  breached,
  started_at,
  response_due_at,
  resolution_due_at,
  responded_at,
  resolved_at,
  created_at,
  updated_at
`;

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
};

export const SLA_STATUS_LABELS: Record<Exclude<SlaStatus, null>, string> = {
  on_track: "On track",
  warning: "Warning",
  breached: "Breached",
};

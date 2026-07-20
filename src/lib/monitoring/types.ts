import type { Json } from "@/types/database";
import { formatAppDateTimeCompact } from "@/lib/i18n";

export const MONITORING_PROVIDERS = [
  "Manual",
  "Webhook",
  "HTTP",
  "Healthcheck",
  "Supabase",
  "Stripe",
  "OpenAI",
  "Anthropic",
  "Email",
  "API",
] as const;

export type MonitoringProvider = (typeof MONITORING_PROVIDERS)[number];

export const MONITORING_STATUSES = [
  "active",
  "paused",
  "failed",
  "disabled",
  "archived",
] as const;

export type MonitoringConnectorStatus = (typeof MONITORING_STATUSES)[number];

export const MONITORING_EVENT_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export type MonitoringEventSeverity = (typeof MONITORING_EVENT_SEVERITIES)[number];

export const MONITORING_EVENT_STATUSES = ["open", "resolved", "ignored"] as const;

export type MonitoringEventStatus = (typeof MONITORING_EVENT_STATUSES)[number];

export type MonitoringConnectorConfiguration = {
  clientId?: string | null;
  endpoint?: string | null;
  createIncidentOnCritical?: boolean;
  createRiskOnFailure?: boolean;
  healthImpactEnabled?: boolean;
  checkIntervalMinutes?: number;
  [key: string]: Json | undefined;
};

export type MonitoringConnector = {
  id: string;
  organization_id: string;
  name: string;
  provider: string;
  status: MonitoringConnectorStatus;
  enabled: boolean;
  configuration: MonitoringConnectorConfiguration;
  last_check_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MonitoringEvent = {
  id: string;
  organization_id: string;
  connector_id: string | null;
  client_id: string | null;
  severity: MonitoringEventSeverity;
  status: MonitoringEventStatus;
  message: string | null;
  payload: Record<string, unknown> | null;
  detected_at: string;
  created_at: string;
};

export type MonitoringActivityView = {
  id: string;
  organization_id: string;
  connector_id: string | null;
  event_type: string;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type MonitoringConnectorMetrics = {
  connectorId: string;
  totalEvents: number;
  criticalEvents: number;
  failureEvents: number;
  recoveryEvents: number;
  lastEventAt: string | null;
  healthPercent: number;
};

export type MonitoringSummary = {
  activeConnectors: number;
  failedConnectors: number;
  pausedConnectors: number;
  eventsToday: number;
  criticalEventsToday: number;
  lastCheckAt: string | null;
  connectorHealthPercent: number;
  recentActivity: MonitoringActivityView[];
  recentEvents: MonitoringEvent[];
};

export type MonitoringDashboardMetrics = {
  activeConnectors: number;
  failedConnectors: number;
  eventsToday: number;
  criticalEvents: number;
  lastCheckAt: string | null;
  connectorHealthPercent: number;
};

export type ClientMonitoringSummary = {
  connectedCount: number;
  recentEvents: MonitoringEvent[];
  healthImpactEvents: number;
  openIncidents: number;
  openRisks: number;
};

export type MonitoringReportSnapshot = {
  connectorCount: number;
  failures: number;
  recoveries: number;
  healthImpactEvents: number;
};

export const MONITORING_PROVIDER_LABELS: Record<MonitoringProvider, string> = {
  Manual: "Manual",
  Webhook: "Webhook",
  HTTP: "HTTP",
  Healthcheck: "Healthcheck",
  Supabase: "Supabase",
  Stripe: "Stripe",
  OpenAI: "OpenAI",
  Anthropic: "Anthropic",
  Email: "Email",
  API: "API",
};

export const MONITORING_STATUS_LABELS: Record<MonitoringConnectorStatus, string> = {
  active: "Active",
  paused: "Paused",
  failed: "Failed",
  disabled: "Disabled",
  archived: "Archived",
};

export function parseConnectorConfiguration(
  value: Json | MonitoringConnectorConfiguration | null | undefined,
): MonitoringConnectorConfiguration {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as MonitoringConnectorConfiguration;
}

export function mapConnectorRow(row: Record<string, unknown>): MonitoringConnector {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    name: String(row.name),
    provider: String(row.provider),
    status: row.status as MonitoringConnectorStatus,
    enabled: Boolean(row.enabled),
    configuration: parseConnectorConfiguration(row.configuration as Json),
    last_check_at: (row.last_check_at as string | null) ?? null,
    last_success_at: (row.last_success_at as string | null) ?? null,
    last_failure_at: (row.last_failure_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapMonitoringEventRow(row: Record<string, unknown>): MonitoringEvent {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    connector_id: (row.connector_id as string | null) ?? null,
    client_id: (row.client_id as string | null) ?? null,
    severity: row.severity as MonitoringEventSeverity,
    status: row.status as MonitoringEventStatus,
    message: (row.message as string | null) ?? null,
    payload:
      row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
        ? (row.payload as Record<string, unknown>)
        : null,
    detected_at: String(row.detected_at),
    created_at: String(row.created_at),
  };
}

export function mapMonitoringActivityRow(row: Record<string, unknown>): MonitoringActivityView {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    connector_id: (row.connector_id as string | null) ?? null,
    event_type: String(row.event_type),
    message: (row.message as string | null) ?? null,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    created_at: String(row.created_at),
  };
}

export function formatMonitoringTimestamp(value: string | null | undefined): string {
  return formatAppDateTimeCompact(value);
}

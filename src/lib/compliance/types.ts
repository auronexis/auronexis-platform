/** Compliance, audit, and governance platform types. */

export type AuditSeverity = "info" | "low" | "medium" | "high" | "critical";

export type AuditExportFormat = "csv" | "json" | "evidence";

export type AuditExportStatus = "pending" | "processing" | "completed" | "failed";

export type ComplianceFrameworkKey =
  | "soc2"
  | "iso27001"
  | "gdpr"
  | "nis2"
  | "dora"
  | "hipaa";

export type CompliancePolicyStatus = "draft" | "active" | "deprecated";

export type RetentionPeriod =
  | "30d"
  | "90d"
  | "180d"
  | "1y"
  | "3y"
  | "7y"
  | "forever";

export type RetentionDataCategory =
  | "ai_logs"
  | "reports"
  | "audit_events"
  | "connector_sync_history"
  | "executions"
  | "api_logs"
  | "invoices"
  | "notifications"
  | "knowledge_entries"
  | "portal_activity";

export type GdprRequestType =
  | "access"
  | "deletion"
  | "export"
  | "correction"
  | "restriction"
  | "consent_withdrawal";

export type GdprRequestStatus =
  | "open"
  | "processing"
  | "completed"
  | "rejected"
  | "expired";

export type SecurityIncidentSeverity = "low" | "medium" | "high" | "critical";

export type SecurityIncidentStatus =
  | "open"
  | "investigating"
  | "mitigated"
  | "resolved";

export type GovernanceControlKey =
  | "identity"
  | "encryption"
  | "logging"
  | "monitoring"
  | "backups"
  | "secrets"
  | "retention"
  | "auditing"
  | "incident_management"
  | "access_control"
  | "api_security"
  | "vendor_management"
  | "business_continuity"
  | "risk_management"
  | "change_management"
  | "evidence_management";

export type ReadinessLevel = "initial" | "developing" | "managed" | "optimized";

export type AuditEventView = {
  id: string;
  organizationId: string;
  userId: string | null;
  entityType: string;
  entityId: string | null;
  eventType: string;
  severity: AuditSeverity;
  ipAddress: string | null;
  userAgent: string | null;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  deepLink: string | null;
};

export type AuditSearchFilters = {
  query?: string;
  entityType?: string;
  eventType?: string;
  severity?: AuditSeverity;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type AuditSearchResult = {
  items: AuditEventView[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type ComplianceDashboardData = {
  complianceScore: number;
  readinessPercent: number;
  maturityScore: number;
  readinessLevel: ReadinessLevel;
  openFindings: number;
  openSecurityIncidents: number;
  openGdprRequests: number;
  retentionCoveragePercent: number;
  activePolicies: number;
  lastExportAt: string | null;
  frameworkScores: FrameworkScore[];
  controlScores: ControlScore[];
  recommendations: string[];
};

export type FrameworkScore = {
  framework: ComplianceFrameworkKey;
  label: string;
  readinessPercent: number;
  implementedControls: number;
  totalControls: number;
};

export type ControlScore = {
  control: GovernanceControlKey;
  label: string;
  score: number;
  status: "pass" | "partial" | "fail";
  evidenceAvailable: boolean;
};

export type ComplianceDiagnosticsSnapshot = {
  platformVersion: string;
  auditEventsTotal: number;
  auditGrowth7d: number;
  retentionCoveragePercent: number;
  frameworkReadinessPercent: number;
  evidenceAvailable: boolean;
  openSecurityIncidents: number;
  openGdprRequests: number;
  activePolicies: number;
  lastExportAt: string | null;
  tablesReachable: boolean;
};

export const COMPLIANCE_PLATFORM_VERSION = "compliance-v1";

export const RETENTION_CATEGORY_LABELS: Record<RetentionDataCategory, string> = {
  ai_logs: "AI logs",
  reports: "Reports",
  audit_events: "Audit events",
  connector_sync_history: "Connector sync history",
  executions: "Executions",
  api_logs: "API logs",
  invoices: "Invoices",
  notifications: "Notifications",
  knowledge_entries: "Knowledge entries",
  portal_activity: "Portal activity",
};

export const FRAMEWORK_LABELS: Record<ComplianceFrameworkKey, string> = {
  soc2: "SOC 2",
  iso27001: "ISO 27001",
  gdpr: "GDPR",
  nis2: "NIS2",
  dora: "DORA",
  hipaa: "HIPAA (readiness)",
};

export const GDPR_REQUEST_LABELS: Record<GdprRequestType, string> = {
  access: "Access request",
  deletion: "Deletion request",
  export: "Export request",
  correction: "Correction request",
  restriction: "Restriction request",
  consent_withdrawal: "Consent withdrawal",
};

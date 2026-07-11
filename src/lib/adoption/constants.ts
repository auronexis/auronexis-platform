import type { AdoptionFeatureDefinition } from "@/lib/adoption/types";

/** Weighted score categories — must sum to 100. */
export const ADOPTION_SCORE_WEIGHTS = {
  foundation: 20,
  recurringValue: 25,
  featureBreadth: 20,
  engagementRecency: 15,
  collaboration: 10,
  customerVisibility: 10,
} as const;

/** Days without meaningful activity before inactive stage. */
export const INACTIVITY_THRESHOLD_DAYS = 30;

/** Days without activity before at-risk signal. */
export const STALE_ACTIVITY_DAYS = 14;

/** Minimum combined value events to compute trend. */
export const MIN_TREND_EVENTS = 3;

/** Trend tolerance — 20% change required. */
export const TREND_IMPROVING_RATIO = 1.2;
export const TREND_DECLINING_RATIO = 0.8;

/** Maximum primary recommendations surfaced. */
export const MAX_ADOPTION_RECOMMENDATIONS = 3;

/** Meaningful product-value activity event types. */
export const MEANINGFUL_ACTIVITY_EVENT_TYPES = [
  "client.created",
  "client.updated",
  "report.created",
  "report.published",
  "report.generated",
  "risk.created",
  "risk.resolved",
  "incident.created",
  "incident.resolved",
  "monitoring.connector_created",
  "monitoring.event_detected",
  "team.invited",
  "team.role_updated",
  "sla.created",
  "portal.login",
  "portal.report_viewed",
] as const;

/** Customer-facing delivery events for visibility scoring. */
export const CUSTOMER_FACING_EVENT_TYPES = [
  "report.published",
  "portal.login",
  "portal.report_viewed",
] as const;

export const ADOPTION_FEATURE_REGISTRY: AdoptionFeatureDefinition[] = [
  {
    key: "clients",
    label: "Clients",
    category: "foundation",
    importance: "core",
    route: "/clients",
    planFeature: null,
    requiredPermission: "clients.read",
  },
  {
    key: "reports",
    label: "Reports",
    category: "operations",
    importance: "core",
    route: "/reports",
    planFeature: "reports",
    requiredPermission: "reports.read",
  },
  {
    key: "published_reports",
    label: "Published reports",
    category: "operations",
    importance: "core",
    route: "/reports",
    planFeature: "reports",
    requiredPermission: "reports.read",
  },
  {
    key: "report_scheduling",
    label: "Report scheduling",
    category: "operations",
    importance: "recommended",
    route: "/reports/schedules",
    planFeature: "report_scheduling",
    requiredPermission: "reports.write",
  },
  {
    key: "risks",
    label: "Risks",
    category: "operations",
    importance: "recommended",
    route: "/risks",
    planFeature: "risks",
    requiredPermission: "risks.read",
  },
  {
    key: "incidents",
    label: "Incidents",
    category: "operations",
    importance: "recommended",
    route: "/incidents",
    planFeature: "incidents",
    requiredPermission: "risks.read",
  },
  {
    key: "monitoring",
    label: "Monitoring",
    category: "operations",
    importance: "recommended",
    route: "/monitoring",
    planFeature: null,
    requiredPermission: "clients.read",
  },
  {
    key: "automations",
    label: "Automations",
    category: "operations",
    importance: "advanced",
    route: "/automation",
    planFeature: "automation_engine",
    requiredPermission: null,
  },
  {
    key: "knowledge",
    label: "Knowledge",
    category: "collaboration",
    importance: "advanced",
    route: "/knowledge",
    planFeature: "ai_knowledge_search",
    requiredPermission: null,
  },
  {
    key: "team_collaboration",
    label: "Team collaboration",
    category: "collaboration",
    importance: "core",
    route: "/settings/team",
    planFeature: null,
    requiredPermission: "users.read",
  },
  {
    key: "client_portal",
    label: "Client portal",
    category: "customer_visibility",
    importance: "recommended",
    route: "/clients",
    planFeature: "customer_portal",
    requiredPermission: "clients.read",
  },
  {
    key: "sla",
    label: "SLA policies",
    category: "operations",
    importance: "recommended",
    route: "/settings/sla",
    planFeature: "sla_tracking",
    requiredPermission: "sla.read",
  },
  {
    key: "profitability",
    label: "Profitability",
    category: "commercial",
    importance: "advanced",
    route: "/profitability",
    planFeature: "profitability",
    requiredPermission: null,
  },
  {
    key: "integrations",
    label: "Integrations",
    category: "operations",
    importance: "advanced",
    route: "/automation/integrations",
    planFeature: "automation_engine",
    requiredPermission: null,
  },
];

export const ADOPTION_STAGE_LABELS: Record<string, string> = {
  newly_activated: "Newly activated",
  early_adoption: "Early adoption",
  developing_habits: "Developing habits",
  operational: "Operational",
  embedded: "Embedded",
  at_risk: "At risk",
  inactive: "Inactive",
};

export const ADOPTION_TREND_LABELS: Record<string, string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
  insufficient_data: "Insufficient data",
};

export const RETENTION_RISK_LABELS: Record<string, string> = {
  healthy: "Healthy",
  watch: "Watch",
  at_risk: "At risk",
  critical: "Critical",
  unknown: "Unknown",
};

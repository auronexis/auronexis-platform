export type IntelligenceSourceType =
  | "database"
  | "calculated"
  | "activity_event"
  | "report"
  | "risk"
  | "incident"
  | "monitoring"
  | "customer_success"
  | "adoption"
  | "health_snapshot"
  | "sla"
  | "profitability"
  | "portal"
  | "team";

export type IntelligenceCategory =
  | "health"
  | "adoption"
  | "customer_success"
  | "delivery"
  | "risk"
  | "incident"
  | "monitoring"
  | "sla"
  | "profitability"
  | "collaboration"
  | "visibility"
  | "operational";

export type IntelligenceEvidence = {
  sourceType: IntelligenceSourceType;
  sourceKey: string;
  label: string;
  value: string | number | boolean | null;
  observedAt: string | null;
  route: string | null;
};

export type IntelligenceRecommendedAction = {
  key: string;
  title: string;
  description: string;
  route: string | null;
  ctaLabel: string | null;
  priority: number;
  permitted: boolean;
  available: boolean;
  rationale: string;
};

export type IntelligenceFinding = {
  id: string;
  category: IntelligenceCategory;
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  summary: string;
  explanation: string;
  confidence: "low" | "medium" | "high";
  evidence: IntelligenceEvidence[];
  recommendedActions: IntelligenceRecommendedAction[];
  generatedBy: "deterministic" | "ai_assisted";
};

export type IntelligenceMetricUnit = "count" | "score" | "percentage" | "currency" | "days";

export type IntelligenceMetric = {
  key: string;
  label: string;
  currentValue: number | null;
  previousValue: number | null;
  unit: IntelligenceMetricUnit;
  direction: "up" | "down" | "stable" | "unknown";
  changeAbsolute: number | null;
  changePercentage: number | null;
  interpretation: "positive" | "negative" | "neutral" | "unknown";
  evidence: IntelligenceEvidence[];
};

export type IntelligenceChange = {
  key: string;
  label: string;
  currentValue: number | null;
  previousValue: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  direction: "up" | "down" | "stable" | "unknown";
  significance: "minor" | "moderate" | "major";
  interpretation: "positive" | "negative" | "neutral" | "unknown";
  evidence: IntelligenceEvidence[];
};

export type ExecutivePriorityClient = {
  clientId: string;
  clientName: string;
  priorityScore: number;
  healthScore: number | null;
  healthStatus: string;
  trend: string;
  primaryReason: string;
  supportingReasons: string[];
  activePlaybookCount: number;
  overdueTaskCount: number;
  openRiskCount: number;
  openIncidentCount: number;
  recommendedAction: IntelligenceRecommendedAction | null;
};

export type ExecutiveOperationalItem = {
  id: string;
  type: "task" | "incident" | "risk" | "monitoring" | "sla";
  title: string;
  clientId: string | null;
  clientName: string | null;
  dueAt: string | null;
  severity: string;
  route: string | null;
};

export type ExecutiveRecoveryItem = {
  clientId: string;
  clientName: string;
  recoveryStatus: string;
  playbookName: string | null;
  healthDelta: number | null;
  completedAt: string | null;
};

export type ExecutiveCapabilityGap = {
  key: string;
  label: string;
  description: string;
  route: string | null;
  available: boolean;
};

export type IntelligencePeriodPreset = "7d" | "30d" | "90d" | "month";

export type IntelligencePeriod = {
  currentStart: string;
  currentEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
  label: string;
  preset: IntelligencePeriodPreset;
};

export type ExecutiveIntelligenceSnapshot = {
  organizationId: string;
  period: IntelligencePeriod;
  organizationHealth: IntelligenceMetric;
  adoption: IntelligenceMetric;
  customerSuccess: IntelligenceMetric;
  delivery: IntelligenceMetric;
  riskExposure: IntelligenceMetric;
  incidentStability: IntelligenceMetric;
  monitoringReliability: IntelligenceMetric;
  profitability: IntelligenceMetric | null;
  collaboration: IntelligenceMetric;
  customerVisibility: IntelligenceMetric;
  topFindings: IntelligenceFinding[];
  criticalChanges: IntelligenceChange[];
  positiveChanges: IntelligenceChange[];
  negativeChanges: IntelligenceChange[];
  priorityClients: ExecutivePriorityClient[];
  overdueOperationalWork: ExecutiveOperationalItem[];
  recentRecoveries: ExecutiveRecoveryItem[];
  underusedCapabilities: ExecutiveCapabilityGap[];
  recommendedActions: IntelligenceRecommendedAction[];
  hasEnoughData: boolean;
  generatedAt: string;
};

export type ExecutiveBriefing = {
  title: string;
  periodLabel: string;
  summary: string;
  keyWins: IntelligenceFinding[];
  concerns: IntelligenceFinding[];
  priorityClients: ExecutivePriorityClient[];
  recommendedActions: IntelligenceRecommendedAction[];
  narrative: string;
  generatedBy: "deterministic" | "ai_assisted";
  generatedAt: string;
};

export type ClientIntelligenceSummary = {
  clientId: string;
  clientName: string;
  healthScore: number | null;
  healthStatus: string;
  trend: string;
  recentChanges: IntelligenceChange[];
  findings: IntelligenceFinding[];
  recommendedActions: IntelligenceRecommendedAction[];
  narrative: string;
  generatedBy: "deterministic" | "ai_assisted";
  generatedAt: string;
};

export type DashboardExecutiveIntelligenceMode = "hidden" | "critical" | "summary";

export type ExecutiveIntelligenceActionResult =
  | { success: true; data?: unknown }
  | { success: false; error: string; code?: string };

export type GroundedNarrativeInput = {
  snapshot: ExecutiveIntelligenceSnapshot;
  briefing: ExecutiveBriefing;
  evidenceKeys: string[];
};

export type GroundedNarrativeResult = {
  narrative: string;
  generatedBy: "deterministic" | "ai_assisted";
  provider: string | null;
  model: string | null;
};

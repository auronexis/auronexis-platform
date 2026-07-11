export type ClientSuccessHealthStatus =
  | "healthy"
  | "stable"
  | "watch"
  | "at_risk"
  | "critical"
  | "insufficient_data";

export type ClientSuccessTrend = "improving" | "stable" | "declining" | "insufficient_data";

export type ClientRecoveryStatus =
  | "not_started"
  | "intervention_active"
  | "improving"
  | "recovered"
  | "unresolved"
  | "worsened"
  | "insufficient_data";

export type SuccessPriority = "low" | "medium" | "high" | "urgent";

export type PlaybookInstanceStatus = "suggested" | "active" | "paused" | "completed" | "cancelled";

export type SuccessTaskStatus = "open" | "in_progress" | "completed" | "skipped" | "cancelled";

export type ClientSuccessHealthBreakdown = {
  deliveryConsistency: number;
  riskExposure: number;
  incidentStability: number;
  customerEngagement: number;
  serviceReliability: number;
  customerVisibility: number;
  successExecution: number;
  total: number;
};

export type ClientSuccessSignal = {
  code: string;
  label: string;
  description: string;
  impact: "positive" | "neutral" | "negative";
  severity: "low" | "medium" | "high";
  evidence: string;
  source: string;
  observedAt: string | null;
};

export type ClientSuccessRiskSignal = ClientSuccessSignal & { impact: "negative" };

export type ClientValueSignal = ClientSuccessSignal;

export type SuccessPlaybookTaskTemplate = {
  key: string;
  title: string;
  description: string;
  offsetDays: number;
  required: boolean;
  route: string | null;
};

export type SuccessPlaybookDefinition = {
  key: string;
  name: string;
  description: string;
  category: string;
  triggerCodes: string[];
  defaultPriority: SuccessPriority;
  estimatedDurationDays: number;
  requiredPermissions: string[];
  requiredFeatures: string[];
  tasks: SuccessPlaybookTaskTemplate[];
};

export type SuggestedSuccessPlaybook = {
  key: string;
  name: string;
  description: string;
  priority: SuccessPriority;
  reason: string;
  available: boolean;
  permitted: boolean;
};

export type ClientSuccessPlaybookInstance = {
  id: string;
  playbookKey: string;
  name: string;
  status: PlaybookInstanceStatus;
  priority: SuccessPriority;
  assignedToUserId: string | null;
  startedAt: string;
  dueAt: string | null;
  completedAt: string | null;
  triggerCode: string | null;
  taskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
};

export type ClientSuccessTask = {
  id: string;
  playbookInstanceId: string;
  taskKey: string;
  title: string;
  description: string | null;
  status: SuccessTaskStatus;
  required: boolean;
  assignedToUserId: string | null;
  dueAt: string | null;
  completedAt: string | null;
  isOverdue: boolean;
};

export type ClientSuccessAction = {
  key: string;
  title: string;
  description: string;
  route: string;
  ctaLabel: string;
  reason: string;
};

export type ClientSuccessSnapshot = {
  organizationId: string;
  clientId: string;
  clientName: string;
  healthScore: number;
  healthStatus: ClientSuccessHealthStatus;
  healthBreakdown: ClientSuccessHealthBreakdown;
  trend: ClientSuccessTrend;
  adoptionSignals: ClientSuccessSignal[];
  riskSignals: ClientSuccessRiskSignal[];
  valueSignals: ClientValueSignal[];
  openRiskCount: number;
  criticalRiskCount: number;
  openIncidentCount: number;
  overdueTaskCount: number;
  lastPublishedReportAt: string | null;
  lastPortalActivityAt: string | null;
  lastMeaningfulActivityAt: string | null;
  daysSinceLastPublishedReport: number | null;
  daysSinceLastMeaningfulActivity: number | null;
  activePlaybooks: ClientSuccessPlaybookInstance[];
  suggestedPlaybooks: SuggestedSuccessPlaybook[];
  tasks: ClientSuccessTask[];
  recoveryStatus: ClientRecoveryStatus;
  nextBestAction: ClientSuccessAction | null;
  generatedAt: string;
};

export type CustomerSuccessPortfolioEntry = {
  clientId: string;
  clientName: string;
  healthScore: number;
  healthStatus: ClientSuccessHealthStatus;
  trend: ClientSuccessTrend;
  primaryRiskReason: string | null;
  activePlaybookName: string | null;
  overdueTaskCount: number;
  openCriticalIncidentCount: number;
  openHighRiskCount: number;
  nextAction: ClientSuccessAction | null;
  priorityRank: number;
};

export type CustomerSuccessPortfolio = {
  organizationId: string;
  totalActiveClients: number;
  healthyCount: number;
  watchCount: number;
  atRiskCount: number;
  criticalCount: number;
  activePlaybookCount: number;
  overdueTaskCount: number;
  recoveredClientCount: number;
  metrics: CustomerSuccessMetrics;
  priorityQueue: CustomerSuccessPortfolioEntry[];
  activePlaybooks: PortfolioPlaybookWorkload[];
  generatedAt: string;
};

export type CustomerSuccessMetrics = {
  playbooksStarted: number;
  playbooksCompleted: number;
  recoveryRatePercent: number | null;
  averageCompletionDays: number | null;
  clientsRecovered: number;
  overdueWorkCount: number;
  hasEnoughData: boolean;
};

export type PortfolioPlaybookWorkload = {
  instanceId: string;
  clientId: string;
  clientName: string;
  playbookName: string;
  status: PlaybookInstanceStatus;
  assignedToUserId: string | null;
  dueAt: string | null;
  completedTaskCount: number;
  taskCount: number;
  isOverdue: boolean;
};

export type CustomerSuccessTimelineEvent = {
  id: string;
  type: string;
  label: string;
  description: string;
  occurredAt: string;
  source: string;
};

export type CustomerSuccessActionResult =
  | { success: true; data?: { instanceId?: string; taskId?: string } }
  | { success: false; error: string };

export type DashboardCustomerSuccessMode =
  | "hidden"
  | "critical"
  | "summary";

import type { ActivityEventView } from "@/lib/activity/types";
import type { EscalationDashboardMetrics } from "@/lib/escalation/types";
import type { HealthDashboardMetrics } from "@/lib/health/types";
import type { ReportsOverviewMetrics } from "@/lib/reports-v2/types";
import type { RiskHeatmap, RiskSummary } from "@/lib/risks/types";
import type { ClientHealthCounts, ProfitabilitySummary } from "@/lib/profitability/types";
import type { ReportScheduleWithRelations } from "@/lib/report-schedules/types";
import type { SlaDashboardMetrics } from "@/lib/sla/types";
import type { MonitoringDashboardMetrics } from "@/lib/monitoring/types";
import type { IncidentAIDashboardMetrics } from "@/lib/ai-incidents/types";

export type CriticalAlertItem =
  | {
      type: "risk";
      id: string;
      title: string;
      severity: "critical";
      status: string;
      clientName: string | null;
      dueLabel: string | null;
      href: string;
    }
  | {
      type: "incident";
      id: string;
      title: string;
      severity: "critical";
      status: string;
      clientName: string | null;
      dueLabel: string | null;
      href: string;
    };

export type DashboardFeatureAccess = {
  risks: boolean;
  incidents: boolean;
  incidentAI: boolean;
  sla: boolean;
  escalation: boolean;
  scheduling: boolean;
  showBusinessUpgrade: boolean;
};

export type DashboardData = {
  openRiskCount: number;
  openIncidentCount: number;
  slaMetrics: SlaDashboardMetrics;
  escalationMetrics: EscalationDashboardMetrics;
  criticalAlerts: CriticalAlertItem[];
  clientHealth: ClientHealthCounts;
  healthMetrics: HealthDashboardMetrics;
  reportsMetrics: ReportsOverviewMetrics;
  riskSummary: RiskSummary;
  riskHeatmap: RiskHeatmap;
  businessMetrics: ProfitabilitySummary | null;
  canViewFinancial: boolean;
  draftReportsCount: number;
  upcomingSchedules: ReportScheduleWithRelations[];
  recentActivity: ActivityEventView[];
  monitoringMetrics: MonitoringDashboardMetrics;
  incidentAIMetrics: IncidentAIDashboardMetrics;
  features: DashboardFeatureAccess;
};

import { getRecentActivityEvents } from "@/lib/activity/queries";

import type { CriticalIncidentAlert } from "@/lib/incidents/types";

import { getIncidentDashboardMetrics } from "@/lib/incidents/queries";

import { getHealthDashboardMetrics } from "@/lib/health/queries";

import { getReportsOverviewMetrics } from "@/lib/reports-v2/queries";

import { getClientHealthCounts, getProfitabilitySummary } from "@/lib/profitability/queries";

import { canUseFeature } from "@/lib/plans/guards";

import { getUpcomingReportSchedules } from "@/lib/report-schedules/queries";

import { canViewRevenue } from "@/lib/rbac/permissions";

import type { CriticalRiskAlert } from "@/lib/risks/types";

import { getRiskDashboardMetrics } from "@/lib/risks/queries";

import { getEscalationDashboardMetrics } from "@/lib/escalation/queries";

import { processOrganizationReportOverdueEscalations } from "@/lib/escalation/evaluations";

import { getSlaDashboardMetrics, processOrganizationSlaAlerts } from "@/lib/sla/queries";

import type { EscalationDashboardMetrics } from "@/lib/escalation/types";

import type { SlaDashboardMetrics } from "@/lib/sla/types";

import { createClient } from "@/lib/supabase/server";

import type { SessionContext } from "@/lib/tenancy/context";

import type { DashboardData, CriticalAlertItem } from "@/lib/dashboard/types";



const EMPTY_SLA_METRICS: SlaDashboardMetrics = {

  breachedCount: 0,

  warningCount: 0,

  onTrackCount: 0,

  upcomingBreaches: [],

  breachedItems: [],

};



const EMPTY_ESCALATION_METRICS: EscalationDashboardMetrics = {

  activeRulesCount: 0,

  escalationsTodayCount: 0,

  outstandingCount: 0,

  recentEscalations: [],

};



function formatDueLabel(value: string | null | undefined): string | null {

  if (!value) {

    return null;

  }



  return new Intl.DateTimeFormat("en-US", {

    month: "short",

    day: "numeric",

    year: "numeric",

  }).format(new Date(value));

}



async function getDraftReportsCount(session: SessionContext): Promise<number> {

  const supabase = await createClient();



  const { count, error } = await supabase

    .from("reports")

    .select("id", { count: "exact", head: true })

    .eq("organization_id", session.organization.id)

    .eq("status", "draft");



  if (error) {

    throw new Error(error.message);

  }



  return count ?? 0;

}



/** Combined dashboard metrics for risks, incidents, and client health. */

export async function getDashboardMetrics(

  session: SessionContext,

  options: { risksEnabled: boolean; incidentsEnabled: boolean },

): Promise<{

  openRiskCount: number;

  openIncidentCount: number;

  criticalAlerts: CriticalAlertItem[];

  clientHealth: Awaited<ReturnType<typeof getClientHealthCounts>>;

}> {

  const [riskMetrics, incidentMetrics, clientHealth] = await Promise.all([

    options.risksEnabled ? getRiskDashboardMetrics(session) : Promise.resolve({ openRiskCount: 0, criticalRisks: [] }),

    options.incidentsEnabled

      ? getIncidentDashboardMetrics(session)

      : Promise.resolve({ openIncidentCount: 0, criticalIncidents: [] }),

    getClientHealthCounts(session),

  ]);



  const riskAlerts: CriticalAlertItem[] = options.risksEnabled

    ? riskMetrics.criticalRisks.map((risk: CriticalRiskAlert) => ({

        type: "risk",

        id: risk.id,

        title: risk.title,

        severity: "critical",

        status: risk.status,

        clientName: risk.clients?.name ?? null,

        dueLabel: formatDueLabel(risk.due_date),

        href: `/risks/${risk.id}`,

      }))

    : [];



  const incidentAlerts: CriticalAlertItem[] = options.incidentsEnabled

    ? incidentMetrics.criticalIncidents.map((incident: CriticalIncidentAlert) => ({

        type: "incident",

        id: incident.id,

        title: incident.title,

        severity: "critical",

        status: incident.status,

        clientName: incident.clients?.name ?? null,

        dueLabel: formatDueLabel(incident.due_at),

        href: `/incidents/${incident.id}`,

      }))

    : [];



  return {

    openRiskCount: riskMetrics.openRiskCount,

    openIncidentCount: incidentMetrics.openIncidentCount,

    criticalAlerts: [...riskAlerts, ...incidentAlerts].slice(0, 8),

    clientHealth,

  };

}



/** Full dashboard dataset for Dashboard v2. */

export async function getDashboardData(session: SessionContext): Promise<DashboardData> {

  const canViewFinancialRole = canViewRevenue(session.role);



  const [

    risksEnabled,

    incidentsEnabled,

    slaEnabled,

    escalationEnabled,

    profitabilityEnabled,

    schedulingEnabled,

  ] = await Promise.all([

    canUseFeature(session.organization.id, "risks"),

    canUseFeature(session.organization.id, "incidents"),

    canUseFeature(session.organization.id, "sla_tracking"),

    canUseFeature(session.organization.id, "escalation_rules"),

    canUseFeature(session.organization.id, "profitability"),

    canUseFeature(session.organization.id, "report_scheduling"),

  ]);



  const canViewFinancial = canViewFinancialRole && profitabilityEnabled;



  if (slaEnabled) {

    await processOrganizationSlaAlerts(session.organization.id).catch((error) => {

      console.error("[sla] alert processing failed:", error);

    });

  }



  if (escalationEnabled) {

    await processOrganizationReportOverdueEscalations(session.organization.id).catch((error) => {

      console.error("[escalation] report overdue processing failed:", error);

    });

  }



  const [metrics, slaMetrics, escalationMetrics, businessMetrics, draftReportsCount, upcomingSchedules, recentActivity, healthMetrics, reportsMetrics] =

    await Promise.all([

      getDashboardMetrics(session, { risksEnabled, incidentsEnabled }),

      slaEnabled ? getSlaDashboardMetrics(session) : Promise.resolve(EMPTY_SLA_METRICS),

      escalationEnabled ? getEscalationDashboardMetrics(session) : Promise.resolve(EMPTY_ESCALATION_METRICS),

      canViewFinancial ? getProfitabilitySummary(session) : Promise.resolve(null),

      getDraftReportsCount(session),

      schedulingEnabled ? getUpcomingReportSchedules(session, 5) : Promise.resolve([]),

      getRecentActivityEvents(session, 5),

      getHealthDashboardMetrics(session),

      getReportsOverviewMetrics(session),

    ]);



  return {
    ...metrics,
    slaMetrics,
    escalationMetrics,
    businessMetrics,
    healthMetrics,
    reportsMetrics: reportsMetrics.data ?? {
      publishedThisMonth: 0,
      draftCount: draftReportsCount,
      averageHealthScore: null,
      averageSlaScore: null,
      latestReport: null,
    },
    canViewFinancial,
    draftReportsCount,
    upcomingSchedules,
    recentActivity,
    features: {
      risks: risksEnabled,
      incidents: incidentsEnabled,
      sla: slaEnabled,
      escalation: escalationEnabled,
      scheduling: schedulingEnabled,
      showBusinessUpgrade:
        !risksEnabled || !incidentsEnabled || !slaEnabled || !escalationEnabled,
    },
  };
}



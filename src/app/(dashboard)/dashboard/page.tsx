import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  DollarSign,
  FileText,
  Percent,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { AIInsightsCard } from "@/components/dashboard/ai-insights-card";
import { CustomerSuccessDashboardCard } from "@/components/clients/success/clients-success-workspace";
import { ClientHealthOverview } from "@/components/dashboard/client-health-overview";
import { DashboardHealthEngine } from "@/components/health/dashboard-health-engine";
import { DashboardReportsOverview } from "@/components/reports/dashboard-reports-overview";
import { DashboardRisksOverview } from "@/components/risks/dashboard-risks-overview";
import { CommandCenterHero } from "@/components/dashboard/command-center-hero";
import { CustomerSuccessCenterPanel } from "@/components/dashboard/customer-success-center";
import { ExecutiveBriefEmptyState, ExecutiveBriefPanel } from "@/components/dashboard/executive-brief";
import { ExecutiveInsightsPanel } from "@/components/dashboard/executive-insights-panel";
import { HealthTrendsPanel } from "@/components/dashboard/health-trends-panel";
import { PortfolioHealthDistributionPanel } from "@/components/dashboard/portfolio-health-distribution";
import { PriorityClientsPanel } from "@/components/dashboard/priority-clients-panel";
import { SmartTimelinePanel } from "@/components/dashboard/smart-timeline-panel";
import { DashboardActivityTimeline } from "@/components/dashboard/dashboard-activity-timeline";
import { DashboardBusinessUpgradeCard } from "@/components/dashboard/dashboard-business-upgrade-card";
import { DashboardCriticalAlerts } from "@/components/dashboard/dashboard-critical-alerts";
import { DashboardEscalationOverview } from "@/components/dashboard/dashboard-escalation-overview";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-panel";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { SmartRecommendations } from "@/components/dashboard/smart-recommendations";
import { WorkspaceProgress } from "@/components/dashboard/workspace-progress";
import { DashboardSlaOverview } from "@/components/dashboard/dashboard-sla-overview";
import { DashboardMonitoringOverview } from "@/components/monitoring/dashboard-monitoring-overview";
import { DashboardIncidentAIOverview } from "@/components/incidents/ai/dashboard-incident-ai-overview";
import { DashboardRiskAIOverview } from "@/components/ai-risks/dashboard-risk-ai-overview";
import { DashboardExecutiveReportsOverview } from "@/components/executive-reports/dashboard-executive-reports-overview";
import {
  DashboardUpgradeMetricCard,
} from "@/components/dashboard/dashboard-upgrade-cards";
import { ReportsQueueCard } from "@/components/dashboard/reports-queue-card";
import { SystemHealthCard } from "@/components/dashboard/system-health-card";
import { PlatformStatusWidget } from "@/components/dashboard/platform-status-widget";
import { SectionTitle } from "@/components/ui/typography";
import { requireSession } from "@/lib/auth/session";
import { AutomationCenterDashboardClient } from "@/components/automation/automation-center-dashboard-client";
import { IntegrationsHubCard } from "@/components/automation/integrations-hub-card";
import { IntegrationRuntimeHubCard } from "@/components/automation/integration-runtime-hub-card";
import { PredictiveForecastHubCard } from "@/components/predictive/predictive-forecast-hub-card";
import { KnowledgeHubCard } from "@/components/knowledge/knowledge-hub-card";
import { OperationalTasksCard } from "@/components/dashboard/operational-tasks-card";
import { buildOperationalTasks } from "@/lib/ai/operational/tasks";
import { getKnowledgeHubData } from "@/lib/ai/knowledge/get-hub";
import { getOperationalIntelligence } from "@/lib/ai/insights/get-intelligence";
import { getClientSuccessPortfolio } from "@/lib/ai/client-success/get-analysis";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getExecutiveIntelligence } from "@/lib/intelligence/queries";
import {
  buildSmartRecommendations,
  buildWorkspaceProgress,
} from "@/lib/dashboard/workspace-guidance";
import { getIntegrationsDashboardSummary, getIntegrationRuntimeSummary } from "@/lib/integrations/queries";
import { getPredictiveDashboardSummary } from "@/lib/predictive/cache";
import { getComplianceDiagnosticsSnapshot } from "@/lib/compliance/diagnostics";
import { getPlatformStatusSnapshot } from "@/lib/diagnostics/platform-status";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { formatCurrency, formatMargin } from "@/lib/profitability/types";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { listPendingInvitations, listTeamMembers } from "@/lib/team/queries";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session);
  const executiveIntelligence = await getExecutiveIntelligence(session, data);
  const aiAccess = await checkPlanFeatureForSession(session, "ai_report_assistant");
  const successAccess = await checkPlanFeatureForSession(session, "ai_client_analysis");
  const operationalAiAccess = await checkPlanFeatureForSession(session, "ai_risk_assistant");
  const incidentAiAccess = await checkPlanFeatureForSession(session, "ai_incident_assistant");
  const riskAiAccess = await checkPlanFeatureForSession(session, "ai_risk_assistant");
  const automationAccess = await checkPlanFeatureForSession(session, "ai_automation_builder");
  const predictiveAccess = await checkPlanFeatureForSession(session, "ai_predictive_intelligence");
  const knowledgeAccess = await checkPlanFeatureForSession(session, "ai_knowledge_search");
  const intelligence = aiAccess.allowed
    ? await getOperationalIntelligence(session, data)
    : null;
  const successPortfolio = successAccess.allowed
    ? await getClientSuccessPortfolio(session)
    : null;
  const operationalTasks =
    (data.features.risks || data.features.incidents) && operationalAiAccess.allowed
      ? await buildOperationalTasks(session)
      : null;
  const knowledgeHub = knowledgeAccess.allowed ? await getKnowledgeHubData(session) : null;
  const integrationsSummary = automationAccess.allowed
    ? await getIntegrationsDashboardSummary({
        organizationId: session.organization.id,
        userId: session.user.id,
      })
    : null;
  const integrationRuntimeSummary = automationAccess.allowed
    ? await getIntegrationRuntimeSummary({
        organizationId: session.organization.id,
      })
    : null;
  const predictiveSummary = predictiveAccess.allowed
    ? await getPredictiveDashboardSummary(session)
    : null;
  const canManageCompliance = canManageOrganizationSettings(session);
  const complianceSummary = canManageCompliance
    ? await getComplianceDiagnosticsSnapshot(session)
    : null;
  const platformStatus = canManageCompliance ? await getPlatformStatusSnapshot() : null;

  const [teamMembers, pendingInvitations, planContext] = await Promise.all([
    listTeamMembers(session).catch(() => []),
    listPendingInvitations(session).catch(() => []),
    getOrganizationPlanContextForSession(session).catch(() => null),
  ]);

  const guidanceInput = {
    data,
    teamMemberCount: teamMembers.length || 1,
    pendingInvitationCount: pendingInvitations.length,
    knowledgeHub,
    planContext,
  };
  const workspaceProgress = buildWorkspaceProgress(guidanceInput);
  const smartRecommendations = buildSmartRecommendations(guidanceInput);

  const operationalMetrics = [
    {
      key: "clients",
      label: "Clients",
      value: data.clientHealth.totalClients,
      icon: Users,
      trend: "+2 this month",
      tone: "info" as const,
    },
    ...(data.features.risks
      ? [
          {
            key: "risks",
            label: "Open risks",
            value: data.openRiskCount,
            icon: ShieldAlert,
            trend: "Needs attention",
            tone: "warning" as const,
          },
        ]
      : []),
    ...(data.features.incidents
      ? [
          {
            key: "incidents",
            label: "Open incidents",
            value: data.openIncidentCount,
            icon: AlertTriangle,
            trend: "Active queue",
            tone: "danger" as const,
          },
        ]
      : []),
    ...(data.features.sla
      ? [
          {
            key: "sla",
            label: "Breached SLAs",
            value: data.slaMetrics.breachedCount,
            icon: Timer,
            trend: "Compliance watch",
            tone: "danger" as const,
          },
        ]
      : []),
  ];

  const showCriticalAlerts = data.features.risks || data.features.incidents;

  return (
    <div className="space-y-8">
      <CommandCenterHero
        userName={session.user.full_name}
        data={data}
        workspaceHealth={intelligence?.workspaceHealth ?? null}
      />

      <section aria-label="Executive intelligence" className="space-y-4">
        <SectionTitle>Executive intelligence</SectionTitle>

        {executiveIntelligence.hasClients ? (
          <ExecutiveBriefPanel brief={executiveIntelligence.brief} />
        ) : (
          <ExecutiveBriefEmptyState />
        )}

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <DashboardPanel
              title="Priority clients"
              description="Top accounts ranked by deterministic operational priority."
              className="min-h-[320px]"
              variant="glass"
            >
              <PriorityClientsPanel clients={executiveIntelligence.priorityClients} />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-5">
            <DashboardPanel
              title="Portfolio health"
              description="Distribution across healthy, watch, risk, and critical bands."
              className="min-h-[320px]"
            >
              <PortfolioHealthDistributionPanel distribution={executiveIntelligence.portfolioHealth} />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12">
            <DashboardPanel
              title="Executive insights"
              description="Rule-based signals for leadership action across the portfolio."
              className="min-h-[280px]"
              variant="glass"
            >
              <ExecutiveInsightsPanel insights={executiveIntelligence.insights} />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12">
            <DashboardPanel
              title="Customer Success Center"
              description="Categorized accounts linked to existing workspace workflows."
              className="min-h-[280px]"
            >
              <CustomerSuccessCenterPanel categories={executiveIntelligence.successCategories} />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12">
            <DashboardPanel
              title="Health trends"
              description="Portfolio health movement across 7, 30, and 90-day windows."
              className="min-h-[280px]"
            >
              <HealthTrendsPanel trends={executiveIntelligence.healthTrends} />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12">
            <DashboardPanel
              title="Smart timeline"
              description="Recent executive events across reports, risks, incidents, and health."
              action={
                <Link href="/activity" className={cn(linkText, "text-xs")}>
                  View all
                </Link>
              }
              className="min-h-[360px]"
            >
              <SmartTimelinePanel events={executiveIntelligence.timeline} />
            </DashboardPanel>
          </div>
        </div>
      </section>

      <section aria-label="Workspace guidance" className="space-y-4">
        <SectionTitle>Get started</SectionTitle>
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <DashboardQuickActions />
          </div>
          <div className="lg:col-span-4">
            <WorkspaceProgress items={workspaceProgress} />
          </div>
          <div className="lg:col-span-12">
            <SmartRecommendations recommendations={smartRecommendations} />
          </div>
        </div>
      </section>

      <section aria-label="Operational metrics" className="space-y-4">
        <SectionTitle>Operational metrics</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {operationalMetrics.map((metric) => (
            <DashboardMetricCard
              key={metric.key}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              trend={metric.trend}
              tone={metric.tone}
            />
          ))}
        </div>
      </section>

      <section aria-label="Business performance" className="space-y-4">
        <SectionTitle>Business performance</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.canViewFinancial && data.businessMetrics ? (
            <>
              <DashboardMetricCard
                label="Monthly revenue"
                value={formatCurrency(data.businessMetrics.monthlyRevenue)}
                icon={DollarSign}
                trend="+8% this quarter"
                tone="success"
              />
              <DashboardMetricCard
                label="Monthly profit"
                value={formatCurrency(data.businessMetrics.monthlyProfit)}
                icon={TrendingUp}
                trend="Tracking upward"
                tone="success"
              />
              <DashboardMetricCard
                label="Average margin"
                value={formatMargin(data.businessMetrics.averageMargin)}
                icon={Percent}
                trend="Stable this period"
                tone="info"
              />
            </>
          ) : (
            <>
              <DashboardUpgradeMetricCard
                label="Monthly revenue"
                requiredPlanLabel="Professional"
                message="Unlock profitability insights and revenue visibility."
              />
              <DashboardUpgradeMetricCard
                label="Monthly profit"
                requiredPlanLabel="Professional"
                message="Track margin performance across your client portfolio."
              />
              <DashboardUpgradeMetricCard
                label="Average margin"
                requiredPlanLabel="Professional"
                message="See margin trends and financial health at a glance."
              />
            </>
          )}
          <DashboardMetricCard
            label="Reports drafted"
            value={data.draftReportsCount}
            icon={FileText}
            trend="In progress"
            tone="info"
          />
        </div>
      </section>

      <section aria-label="Operations" className="space-y-4">
        <SectionTitle>Operations</SectionTitle>

        {data.features.showBusinessUpgrade ? (
          <div className="mb-4">
            <DashboardBusinessUpgradeCard />
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4">
            <DashboardPanel
              title="System health"
              description="Composite operational posture."
              className="min-h-[320px]"
              variant="glass"
            >
              <SystemHealthCard data={data} />
            </DashboardPanel>
          </div>

          {platformStatus ? (
            <div className="lg:col-span-7 xl:col-span-4">
              <DashboardPanel
                title="Platform status"
                description="Infrastructure, cron, queue, and observability."
                className="min-h-[320px]"
                variant="glass"
              >
                <PlatformStatusWidget snapshot={platformStatus} />
              </DashboardPanel>
            </div>
          ) : null}

          <div className={cn("lg:col-span-7 xl:col-span-4", !platformStatus && "lg:col-span-7")}>
            <DashboardPanel
              title="Client health"
              description="Portfolio health scores from the health engine."
              className="min-h-[320px]"
            >
              <DashboardHealthEngine metrics={data.healthMetrics} />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-7 xl:col-span-4">
            <DashboardPanel
              title="Risks overview"
              description="Open client risks tracked by the risks engine."
              className="min-h-[320px]"
            >
              <DashboardRisksOverview summary={data.riskSummary} heatmap={data.riskHeatmap} />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-7 xl:col-span-4">
            <DashboardPanel
              title="Reports overview"
              description="Publishing activity and report quality metrics."
              className="min-h-[320px]"
            >
              <DashboardReportsOverview metrics={data.reportsMetrics} />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-7 xl:col-span-4">
            <DashboardPanel
              title="Health distribution"
              description="Profitability-based health bands."
              className="min-h-[320px]"
            >
              <ClientHealthOverview counts={data.clientHealth} />
            </DashboardPanel>
          </div>

          {showCriticalAlerts ? (
            <div className="lg:col-span-6 xl:col-span-4">
              <DashboardPanel
                title="Recent alerts"
                description="Critical risks and incidents requiring attention."
                className="min-h-[320px]"
              >
                <DashboardCriticalAlerts alerts={data.criticalAlerts} />
              </DashboardPanel>
            </div>
          ) : null}

          <div
            className={cn(
              showCriticalAlerts ? "lg:col-span-6 xl:col-span-4" : "lg:col-span-12 xl:col-span-4",
            )}
          >
            <DashboardPanel
              title="Reports queue"
              description="Draft work and upcoming delivery."
              className="min-h-[320px]"
            >
              <ReportsQueueCard
                draftReportsCount={data.draftReportsCount}
                upcomingSchedules={data.upcomingSchedules}
                schedulingEnabled={data.features.scheduling}
              />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12 xl:col-span-8">
            <DashboardPanel
              title="AI Insights"
              description="Operational trends, risks, and recommended actions from verified data."
              action={
                aiAccess.allowed ? (
                  <Link href="/dashboard/insights" className={cn(linkText, "text-xs")}>
                    View all
                  </Link>
                ) : null
              }
              className="min-h-[320px]"
              variant="glass"
            >
              <AIInsightsCard
                insights={intelligence?.insights ?? []}
                aiEnabled={aiAccess.allowed}
                upgradeMessage={getFeatureUpgradeMessage("ai_report_assistant")}
                requiredPlanLabel={getRequiredPlanLabel("ai_report_assistant")}
              />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12 xl:col-span-4">
            <DashboardPanel
              title="Customer Success"
              description="Accounts requiring follow-up and reporting attention."
              action={
                successAccess.allowed ? (
                  <Link href="/clients/success" className={cn(linkText, "text-xs")}>
                    View all
                  </Link>
                ) : null
              }
              className="min-h-[320px]"
            >
              <CustomerSuccessDashboardCard
                highlights={successPortfolio?.highlights ?? []}
                aiEnabled={successAccess.allowed}
                upgradeMessage={getFeatureUpgradeMessage("ai_client_analysis")}
                requiredPlanLabel={getRequiredPlanLabel("ai_client_analysis")}
              />
            </DashboardPanel>
          </div>

          {data.features.risks || data.features.incidents ? (
            <div className="lg:col-span-12 xl:col-span-4">
              <DashboardPanel
                title="AI Operational Tasks"
                description="Incidents and risks requiring analyst attention."
                className="min-h-[320px]"
                variant="glass"
              >
                <OperationalTasksCard
                  tasks={operationalTasks?.tasks ?? []}
                  aiEnabled={operationalAiAccess.allowed}
                  upgradeMessage={getFeatureUpgradeMessage("ai_risk_assistant")}
                  requiredPlanLabel={getRequiredPlanLabel("ai_risk_assistant")}
                />
              </DashboardPanel>
            </div>
          ) : null}

          <div className="lg:col-span-12 xl:col-span-4">
            <DashboardPanel
              title="Automation Center"
              description="Running workflows, errors, and recent triggers."
              action={
                automationAccess.allowed ? (
                  <Link href="/automation" className={cn(linkText, "text-xs")}>
                    View all
                  </Link>
                ) : null
              }
              className="min-h-[320px]"
              variant="glass"
            >
              <AutomationCenterDashboardClient
                organizationId={session.organization.id}
                aiEnabled={automationAccess.allowed}
                upgradeMessage={getFeatureUpgradeMessage("ai_automation_builder")}
                requiredPlanLabel={getRequiredPlanLabel("ai_automation_builder")}
              />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12 xl:col-span-4">
            <DashboardPanel
              title="Enterprise Integrations"
              description="Configured providers, readiness, and simulation status."
              action={
                automationAccess.allowed ? (
                  <Link href="/automation/integrations" className={cn(linkText, "text-xs")}>
                    View all
                  </Link>
                ) : null
              }
              className="min-h-[320px]"
              variant="glass"
            >
              <IntegrationsHubCard
                summary={
                  integrationsSummary ?? {
                    registeredCount: 0,
                    configuredCount: 0,
                    readyCount: 0,
                    simulationStatus: "disabled",
                    workflowIntegrationActionCount: 0,
                  }
                }
                aiEnabled={automationAccess.allowed}
                upgradeMessage={getFeatureUpgradeMessage("ai_automation_builder")}
                requiredPlanLabel={getRequiredPlanLabel("ai_automation_builder")}
              />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12 xl:col-span-4">
            <DashboardPanel
              title="Integration Runtime"
              description="Live delivery status, retries, and latency."
              action={
                automationAccess.allowed ? (
                  <Link href="/automation/integrations/logs" className={cn(linkText, "text-xs")}>
                    View logs
                  </Link>
                ) : null
              }
              className="min-h-[320px]"
              variant="glass"
            >
              <IntegrationRuntimeHubCard
                summary={
                  integrationRuntimeSummary ?? {
                    running: 0,
                    failed: 0,
                    retrying: 0,
                    deliveredToday: 0,
                    averageLatencyMs: null,
                  }
                }
                aiEnabled={automationAccess.allowed}
                upgradeMessage={getFeatureUpgradeMessage("ai_automation_builder")}
                requiredPlanLabel={getRequiredPlanLabel("ai_automation_builder")}
              />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12 xl:col-span-4">
            <DashboardPanel
              title="Predictive Intelligence"
              description="Clients declining, incident and breach forecasts, churn risk, confidence."
              action={
                predictiveAccess.allowed ? (
                  <Link href="/predictive" className={cn(linkText, "text-xs")}>
                    View all
                  </Link>
                ) : null
              }
              className="min-h-[320px]"
              variant="glass"
            >
              <PredictiveForecastHubCard
                summary={
                  predictiveSummary ?? {
                    customersAtRisk: 0,
                    predictedSlaBreaches: 0,
                    predictedIncidents: 0,
                    revenueTrend: "unknown",
                    averageConfidence: 0,
                    clientsDeclining: 0,
                    highChurnRisk: 0,
                    forecastAccuracy: null,
                  }
                }
                aiEnabled={predictiveAccess.allowed}
                upgradeMessage={getFeatureUpgradeMessage("ai_predictive_intelligence")}
                requiredPlanLabel={getRequiredPlanLabel("ai_predictive_intelligence")}
              />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-12 xl:col-span-4">
            <DashboardPanel
              title="Knowledge Hub"
              description="Articles, playbooks, and knowledge gaps from verified history."
              action={
                knowledgeAccess.allowed ? (
                  <Link href="/knowledge" className={cn(linkText, "text-xs")}>
                    View all
                  </Link>
                ) : null
              }
              className="min-h-[320px]"
              variant="glass"
            >
              <KnowledgeHubCard
                data={knowledgeHub}
                aiEnabled={knowledgeAccess.allowed}
                upgradeMessage={getFeatureUpgradeMessage("ai_knowledge_search")}
                requiredPlanLabel={getRequiredPlanLabel("ai_knowledge_search")}
              />
            </DashboardPanel>
          </div>

          {canManageCompliance && complianceSummary ? (
            <div className="lg:col-span-12 xl:col-span-4">
              <DashboardPanel
                title="Compliance & Governance"
                description="Audit readiness, framework scoring, and trust infrastructure."
                action={
                  <Link href="/dashboard/compliance" className={cn(linkText, "text-xs")}>
                    Open center
                  </Link>
                }
                className="min-h-[320px]"
                variant="glass"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                      Readiness
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {complianceSummary.frameworkReadinessPercent}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Shield className="h-4 w-4 text-primary" aria-hidden />
                      Audit events
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {complianceSummary.auditEventsTotal}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      +{complianceSummary.auditGrowth7d} in the last 7 days
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
                    <p className="text-sm text-muted">Open GDPR requests</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {complianceSummary.openGdprRequests}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
                    <p className="text-sm text-muted">Security incidents</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {complianceSummary.openSecurityIncidents}
                    </p>
                  </div>
                </div>
              </DashboardPanel>
            </div>
          ) : null}

          <div className="lg:col-span-12 xl:col-span-8">
            <DashboardPanel
              title="Recent activity"
              description="Latest movement across your workspace."
              action={
                <Link href="/activity" className={cn(linkText, "text-xs")}>
                  View all
                </Link>
              }
              className="min-h-[360px]"
            >
              <DashboardActivityTimeline events={data.recentActivity} />
            </DashboardPanel>
          </div>

          {data.features.sla ? (
            <div className="lg:col-span-6 xl:col-span-6">
              <DashboardPanel title="SLA overview" className="min-h-[320px]">
                <DashboardSlaOverview metrics={data.slaMetrics} />
              </DashboardPanel>
            </div>
          ) : null}

          <div className="lg:col-span-6 xl:col-span-6">
            <DashboardPanel
              title="Monitoring"
              description="Connector health and operational signals."
              className="min-h-[320px]"
            >
              <DashboardMonitoringOverview metrics={data.monitoringMetrics} />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-6 xl:col-span-6">
            <DashboardPanel
              title="AI Insights"
              description="Incident assistant analyses and confidence trends."
              className="min-h-[320px]"
            >
              <DashboardIncidentAIOverview
                metrics={data.incidentAIMetrics}
                aiEnabled={incidentAiAccess.allowed}
                upgradeMessage={getFeatureUpgradeMessage("ai_incident_assistant")}
              />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-6 xl:col-span-6">
            <DashboardPanel
              title="AI Risk Insights"
              description="Risk assistant analyses and mitigation confidence."
              className="min-h-[320px]"
            >
              <DashboardRiskAIOverview
                metrics={data.riskAIMetrics}
                aiEnabled={riskAiAccess.allowed}
                upgradeMessage={getFeatureUpgradeMessage("ai_risk_assistant")}
              />
            </DashboardPanel>
          </div>

          <div className="lg:col-span-6 xl:col-span-6">
            <DashboardPanel
              title="Executive Reports"
              description="Leadership deliverables, confidence, and compliance trends."
              className="min-h-[320px]"
            >
              <DashboardExecutiveReportsOverview metrics={data.executiveReportMetrics} />
            </DashboardPanel>
          </div>

          {data.features.escalation ? (
            <div className="lg:col-span-6 xl:col-span-6">
              <DashboardPanel title="Escalation overview" className="min-h-[320px]">
                <DashboardEscalationOverview metrics={data.escalationMetrics} />
              </DashboardPanel>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

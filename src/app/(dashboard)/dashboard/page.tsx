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
import { ActivationPanel } from "@/components/activation/activation-panel";
import { ActivationTracker } from "@/components/activation/activation-tracker";
import { ActivationWelcome } from "@/components/activation/activation-welcome";
import { AdoptionSummaryPanel } from "@/components/adoption/adoption-summary-panel";
import { AdoptionTracker } from "@/components/adoption/adoption-tracker";
import { CustomerSuccessSummaryPanel } from "@/components/customer-success/customer-success-summary-panel";
import { CustomerSuccessTracker } from "@/components/customer-success/customer-success-tracker";
import { ExecutiveIntelligenceSummaryPanel } from "@/components/executive-intelligence/executive-intelligence-summary-panel";
import { ExecutiveIntelligenceTracker } from "@/components/executive-intelligence/executive-intelligence-tracker";
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
import { sessionHasPermission } from "@/lib/authorization/guards";
import { AutomationCenterDashboardClient } from "@/components/automation/automation-center-dashboard-client";
import { IntegrationsHubCard } from "@/components/automation/integrations-hub-card";
import { IntegrationRuntimeHubCard } from "@/components/automation/integration-runtime-hub-card";
import { PredictiveForecastHubCard } from "@/components/predictive/predictive-forecast-hub-card";
import { KnowledgeHubCard } from "@/components/knowledge/knowledge-hub-card";
import { OperationalTasksCard } from "@/components/dashboard/operational-tasks-card";
import { OperationsCenter } from "@/components/dashboard/operations-center";
import { buildOperationalTasks } from "@/lib/ai/operational/tasks";
import { getKnowledgeHubData } from "@/lib/ai/knowledge/get-hub";
import { getOperationalIntelligence } from "@/lib/ai/insights/get-intelligence";
import { getClientSuccessPortfolio } from "@/lib/ai/client-success/get-analysis";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getExecutiveIntelligence } from "@/lib/intelligence/queries";
import {
  buildSmartRecommendations,
  resolveDashboardOperationalMetrics,
} from "@/lib/dashboard/workspace-guidance";
import { buildActivationSnapshot } from "@/lib/activation/status";
import { buildAdoptionSnapshot, resolveDashboardGuidanceMode } from "@/lib/adoption/snapshot";
import {
  buildCustomerSuccessPortfolio,
  resolveDashboardCustomerSuccessMode,
} from "@/lib/customer-success/snapshot";
import {
  buildExecutiveIntelligenceSnapshot,
  resolveDashboardExecutiveIntelligenceMode,
} from "@/lib/executive-intelligence/snapshot";
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
import { getStoredOrganizationCurrency } from "@/lib/i18n";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { listPendingInvitations, listTeamMembers } from "@/lib/team/queries";
import { cn } from "@/lib/utils/cn";
import { focusRing, linkText } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await requireSession();
  const currency = getStoredOrganizationCurrency(session.organization);
  const data = await getDashboardData(session);
  const [
    executiveIntelligence,
    aiAccess,
    successAccess,
    operationalAiAccess,
    incidentAiAccess,
    riskAiAccess,
    automationAccess,
    predictiveAccess,
    knowledgeAccess,
  ] = await Promise.all([
    getExecutiveIntelligence(session, data),
    checkPlanFeatureForSession(session, "ai_report_assistant"),
    checkPlanFeatureForSession(session, "ai_client_analysis"),
    checkPlanFeatureForSession(session, "ai_risk_assistant"),
    checkPlanFeatureForSession(session, "ai_incident_assistant"),
    checkPlanFeatureForSession(session, "ai_risk_assistant"),
    checkPlanFeatureForSession(session, "ai_automation_builder"),
    checkPlanFeatureForSession(session, "ai_predictive_intelligence"),
    checkPlanFeatureForSession(session, "ai_knowledge_search"),
  ]);

  const canManageCompliance = canManageOrganizationSettings(session);

  const [
    intelligence,
    successPortfolio,
    operationalTasks,
    knowledgeHub,
    integrationsSummary,
    integrationRuntimeSummary,
    predictiveSummary,
    complianceSummary,
    platformStatus,
    teamMembers,
    pendingInvitations,
    planContext,
  ] = await Promise.all([
    aiAccess.allowed ? getOperationalIntelligence(session, data) : Promise.resolve(null),
    successAccess.allowed ? getClientSuccessPortfolio(session) : Promise.resolve(null),
    (data.features.risks || data.features.incidents) && operationalAiAccess.allowed
      ? buildOperationalTasks(session)
      : Promise.resolve(null),
    knowledgeAccess.allowed ? getKnowledgeHubData(session) : Promise.resolve(null),
    automationAccess.allowed
      ? getIntegrationsDashboardSummary({
          organizationId: session.organization.id,
          userId: session.user.id,
        })
      : Promise.resolve(null),
    automationAccess.allowed
      ? getIntegrationRuntimeSummary({
          organizationId: session.organization.id,
        })
      : Promise.resolve(null),
    predictiveAccess.allowed ? getPredictiveDashboardSummary(session) : Promise.resolve(null),
    canManageCompliance ? getComplianceDiagnosticsSnapshot(session) : Promise.resolve(null),
    canManageCompliance ? getPlatformStatusSnapshot() : Promise.resolve(null),
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
    session,
  };

  const activation = await buildActivationSnapshot({
    session,
    planContext,
    teamMemberCount: teamMembers.length || 1,
    pendingInvitationCount: pendingInvitations.length,
    knowledgeHub,
    openRiskCount: data.openRiskCount,
    monitoringConnectorCount: data.monitoringMetrics.activeConnectors,
  });

  const canReadCustomerSuccess = sessionHasPermission(session, "customer_success.read");

  const [adoption, smartRecommendations, customerSuccessPortfolio] = await Promise.all([
    buildAdoptionSnapshot({
      session,
      planContext,
      teamMemberCount: teamMembers.length || 1,
      pendingInvitationCount: pendingInvitations.length,
      knowledgeHub,
      openRiskCount: data.openRiskCount,
      monitoringConnectorCount: data.monitoringMetrics.activeConnectors,
      activation,
    }),
    buildSmartRecommendations(guidanceInput),
    canReadCustomerSuccess
      ? buildCustomerSuccessPortfolio({ session, planContext })
      : Promise.resolve(null),
  ]);

  const guidanceMode = resolveDashboardGuidanceMode(activation, adoption);
  const customerSuccessMode = customerSuccessPortfolio
    ? resolveDashboardCustomerSuccessMode(activation, adoption, customerSuccessPortfolio)
    : "hidden";

  const canReadExecutiveIntelligence = sessionHasPermission(session, "executive_intelligence.read");
  const executiveSnapshot = canReadExecutiveIntelligence
    ? await buildExecutiveIntelligenceSnapshot({
        session,
        dashboardData: data,
        activation,
        adoption,
        customerSuccessPortfolio,
        planContext,
        canReadCustomerSuccess,
      })
    : null;
  const executiveIntelligenceMode =
    executiveSnapshot && customerSuccessMode !== "critical"
      ? resolveDashboardExecutiveIntelligenceMode(
          activation,
          adoption,
          customerSuccessMode,
          executiveSnapshot,
        )
      : "hidden";

  const canDismissActivation = canManageOrganizationSettings(session);

  const operationalMetrics = resolveDashboardOperationalMetrics(data).map((metric) => ({
    ...metric,
    icon:
      metric.key === "clients"
        ? Users
        : metric.key === "risks"
          ? ShieldAlert
          : metric.key === "incidents"
            ? AlertTriangle
            : Timer,
  }));

  const showCriticalAlerts = data.features.risks || data.features.incidents;
  const guidanceNeedsAttention =
    guidanceMode === "activation_primary" ||
    guidanceMode === "adoption_risk" ||
    customerSuccessMode === "critical" ||
    executiveIntelligenceMode === "critical";
  const guidanceCompact = !guidanceNeedsAttention;
  const opsAlertCount = data.criticalAlerts.length;
  const opsOpenRisks = data.openRiskCount;
  const opsOverviewBadge = opsAlertCount + opsOpenRisks + data.openIncidentCount;
  const opsAutomationBadge =
    (integrationRuntimeSummary?.failed ?? 0) + (integrationRuntimeSummary?.retrying ?? 0);
  const opsComplianceBadge =
    (complianceSummary?.openGdprRequests ?? 0) + (complianceSummary?.openSecurityIncidents ?? 0);
  const opsTaskCount = operationalTasks?.tasks?.length ?? 0;

  /**
   * Ops tab grids: 2-col from md, 12-col from lg.
   * Without md:, viewports below 1024 single-stacked all Overview panels
   * (~2413px Overview / ~6358px #main-content) — remaining scrollspace after
   * inactive-tab unmount.
   */
  const opsPanelGrid = "grid gap-2 md:grid-cols-2 lg:grid-cols-12";

  return (
    <div className="space-y-6">
      <ActivationTracker
        organizationId={session.organization.id}
        event={activation.firstValueReached ? "workspace_activated" : "onboarding_started"}
        stage={activation.stage}
        completionPercent={activation.completionPercent}
        sourceRoute="/dashboard"
        milestoneKey={activation.firstValueReached ? "first_value" : undefined}
      />

      {activation.showWelcome ? (
        <ActivationWelcome
          userName={session.user.full_name}
          activation={activation}
          canDismiss={canDismissActivation}
        />
      ) : null}

      <CommandCenterHero
        userName={session.user.full_name}
        data={data}
        workspaceHealth={intelligence?.workspaceHealth ?? null}
      />

      <section aria-label="Executive intelligence" className="space-y-4">
        <SectionTitle>Executive intelligence</SectionTitle>

        {executiveIntelligence.hasClients ? (
          <ExecutiveBriefPanel brief={executiveIntelligence.brief} aiBriefEnabled={aiAccess.allowed} />
        ) : (
          <ExecutiveBriefEmptyState />
        )}

        <DashboardPanel
          title="Customer Success Center"
          description="High-risk, opportunity, follow-up, and reporting signals."
          contentClassName="p-3 sm:p-4"
        >
          <CustomerSuccessCenterPanel categories={executiveIntelligence.successCategories} />
        </DashboardPanel>

        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-7">
            <DashboardPanel
              title="Priority clients"
              description="Top accounts ranked by deterministic operational priority."
              variant="glass"
            >
              <PriorityClientsPanel clients={executiveIntelligence.priorityClients} />
            </DashboardPanel>
          </div>

          <div className="md:col-span-5">
            <DashboardPanel
              title="Portfolio health"
              description="Distribution across healthy, watch, risk, and critical bands."
            >
              <PortfolioHealthDistributionPanel distribution={executiveIntelligence.portfolioHealth} />
            </DashboardPanel>
          </div>
        </div>

        <details className="group rounded-2xl border border-border/70 bg-surface/50 open:bg-surface/80">
          <summary
            className={cn(
              "cursor-pointer list-none px-5 py-3 text-sm font-semibold text-foreground",
              "marker:content-none [&::-webkit-details-marker]:hidden",
              focusRing,
            )}
          >
            <span className="flex items-center justify-between gap-3">
              <span>More executive intelligence</span>
              <span className="text-xs font-medium text-muted group-open:hidden">
                Insights · Health trends · Timeline
              </span>
              <span className="hidden text-xs font-medium text-muted group-open:inline">Hide</span>
            </span>
          </summary>
          <div className="space-y-3 border-t border-border/70 px-3 pb-3 pt-3 sm:px-4">
            <DashboardPanel
              title="Executive insights"
              description="Rule-based signals for leadership action across the portfolio."
              variant="glass"
            >
              <ExecutiveInsightsPanel insights={executiveIntelligence.insights} />
            </DashboardPanel>
            <DashboardPanel
              title="Health trends"
              description="Portfolio health movement across 7, 30, and 90-day windows."
            >
              <HealthTrendsPanel trends={executiveIntelligence.healthTrends} />
            </DashboardPanel>
            <DashboardPanel
              title="Smart timeline"
              description="Recent executive events across reports, risks, incidents, and health."
              action={
                <Link href="/activity" className={cn(linkText, "text-xs")}>
                  View all
                </Link>
              }
            >
              <SmartTimelinePanel events={executiveIntelligence.timeline} />
            </DashboardPanel>
          </div>
        </details>
      </section>

      <section aria-label="Workspace pulse" className="space-y-3">
        <SectionTitle>Workspace pulse</SectionTitle>
        <section aria-label="Operational metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {operationalMetrics.map((metric) => (
            <DashboardMetricCard
              key={metric.key}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              trend={metric.trend}
              tone={metric.tone}
              size="compact"
            />
          ))}
        </section>
        <section aria-label="Business performance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.canViewFinancial && data.businessMetrics ? (
            <>
              <DashboardMetricCard
                label="Monthly revenue"
                value={formatCurrency(data.businessMetrics.monthlyRevenue, currency)}
                icon={DollarSign}
                trend="+8% this quarter"
                tone="success"
                size="compact"
              />
              <DashboardMetricCard
                label="Monthly profit"
                value={formatCurrency(data.businessMetrics.monthlyProfit, currency)}
                icon={TrendingUp}
                trend="Tracking upward"
                tone="success"
                size="compact"
              />
              <DashboardMetricCard
                label="Average margin"
                value={formatMargin(data.businessMetrics.averageMargin)}
                icon={Percent}
                trend="Stable this period"
                tone="info"
                size="compact"
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
            size="compact"
          />
        </section>
      </section>

      <section aria-label="Workspace guidance" className="space-y-3">
        <AdoptionTracker
          event="adoption_summary_viewed"
          snapshot={adoption}
          sourceRoute="/dashboard"
        />
        {guidanceNeedsAttention ? (
          <>
            <SectionTitle>Get started</SectionTitle>
            <div className="grid gap-3 md:grid-cols-12">
              <div className="md:col-span-8">
                <DashboardQuickActions compact />
              </div>
              <div className="md:col-span-4 space-y-3">
                {guidanceMode === "activation_primary" ? (
                  <ActivationPanel activation={activation} canDismiss={canDismissActivation} compact />
                ) : guidanceMode === "adoption_risk" ? (
                  <AdoptionSummaryPanel adoption={adoption} mode={guidanceMode} />
                ) : customerSuccessMode === "critical" && customerSuccessPortfolio ? (
                  <>
                    <CustomerSuccessTracker
                      event="customer_success_summary_viewed"
                      organizationId={session.organization.id}
                    />
                    <CustomerSuccessSummaryPanel portfolio={customerSuccessPortfolio} mode="critical" />
                  </>
                ) : executiveIntelligenceMode === "critical" && executiveSnapshot ? (
                  <>
                    <ExecutiveIntelligenceTracker
                      event="executive_intelligence_viewed"
                      organizationId={session.organization.id}
                    />
                    <ExecutiveIntelligenceSummaryPanel snapshot={executiveSnapshot} mode="critical" />
                  </>
                ) : null}
              </div>
              <div className="md:col-span-12">
                <details className="group rounded-xl border border-border/70 bg-surface/50">
                  <summary
                    className={cn(
                      "cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-foreground",
                      "marker:content-none [&::-webkit-details-marker]:hidden",
                      focusRing,
                    )}
                  >
                    Smart recommendations
                  </summary>
                  <div className="border-t border-border/70 px-2 pb-2 pt-2">
                    <SmartRecommendations recommendations={smartRecommendations} />
                  </div>
                </details>
              </div>
            </div>
          </>
        ) : (
          <details className="group rounded-2xl border border-border/70 bg-surface/50 open:bg-surface/80">
            <summary
              className={cn(
                "cursor-pointer list-none px-5 py-3 text-sm font-semibold text-foreground",
                "marker:content-none [&::-webkit-details-marker]:hidden",
                focusRing,
              )}
            >
              <span className="flex items-center justify-between gap-3">
                <span>Quick actions &amp; workspace guidance</span>
                <span className="text-xs font-medium text-muted group-open:hidden">
                  Expand when needed
                </span>
              </span>
            </summary>
            <div className="space-y-3 border-t border-border/70 px-3 pb-3 pt-3 sm:px-4">
              <DashboardQuickActions compact={guidanceCompact} />
              <div className="grid gap-3 md:grid-cols-12">
                <div className="md:col-span-4 space-y-3">
                  <AdoptionSummaryPanel adoption={adoption} mode={guidanceMode} />
                  {customerSuccessMode === "summary" && customerSuccessPortfolio ? (
                    <>
                      <CustomerSuccessTracker
                        event="customer_success_summary_viewed"
                        organizationId={session.organization.id}
                      />
                      <CustomerSuccessSummaryPanel
                        portfolio={customerSuccessPortfolio}
                        mode="summary"
                      />
                    </>
                  ) : null}
                  {executiveIntelligenceMode === "summary" && executiveSnapshot ? (
                    <>
                      <ExecutiveIntelligenceTracker
                        event="executive_intelligence_viewed"
                        organizationId={session.organization.id}
                      />
                      <ExecutiveIntelligenceSummaryPanel snapshot={executiveSnapshot} mode="summary" />
                    </>
                  ) : null}
                </div>
                <div className="md:col-span-8">
                  <SmartRecommendations recommendations={smartRecommendations} />
                </div>
              </div>
            </div>
          </details>
        )}
      </section>

      <section aria-label="Operations" className="space-y-3">
        <SectionTitle>Operations</SectionTitle>

        {data.features.showBusinessUpgrade ? (
          <DashboardBusinessUpgradeCard />
        ) : null}

        <OperationsCenter
          defaultTabId="overview"
          summary={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              <span>
                <span className="font-semibold text-foreground">{opsOverviewBadge}</span> urgent
                signals
              </span>
              <span>
                <span className="font-semibold text-foreground">{data.draftReportsCount}</span> drafts
              </span>
              <span>
                <span className="font-semibold text-foreground">{opsTaskCount}</span> AI tasks
              </span>
              <span className="text-muted">
                Open a tab for health, intelligence, automation, or governance detail.
              </span>
            </div>
          }
          tabs={[
            {
              id: "overview",
              label: "Overview",
              badge: opsOverviewBadge > 0 ? opsOverviewBadge : null,
              urgent: opsOverviewBadge > 0,
              content: (
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <DashboardPanel
                      title="System health"
                      description="Composite operational posture."
                      variant="glass"
                      contentClassName="p-3"
                    >
                      <SystemHealthCard data={data} />
                    </DashboardPanel>
                  </div>
                  <div className="lg:col-span-4">
                    <DashboardPanel
                      title="Client health"
                      description="Portfolio health scores from the health engine."
                      contentClassName="p-3"
                    >
                      <DashboardHealthEngine metrics={data.healthMetrics} />
                    </DashboardPanel>
                  </div>
                  <div className="lg:col-span-4">
                    <DashboardPanel
                      title="Risks overview"
                      description="Open client risks tracked by the risks engine."
                      contentClassName="p-3"
                    >
                      <DashboardRisksOverview summary={data.riskSummary} heatmap={data.riskHeatmap} />
                    </DashboardPanel>
                  </div>
                  <div className="lg:col-span-4">
                    <DashboardPanel
                      title="Reports overview"
                      description="Publishing activity and report quality metrics."
                      contentClassName="p-3"
                    >
                      <DashboardReportsOverview metrics={data.reportsMetrics} />
                    </DashboardPanel>
                  </div>
                  <div className="lg:col-span-4">
                    <DashboardPanel
                      title="Health distribution"
                      description="Profitability-based health bands."
                      contentClassName="p-3"
                    >
                      <ClientHealthOverview counts={data.clientHealth} />
                    </DashboardPanel>
                  </div>
                  <div className="lg:col-span-4">
                    <DashboardPanel
                      title="Reports queue"
                      description="Draft work and upcoming delivery."
                      contentClassName="p-3"
                    >
                      <ReportsQueueCard
                        draftReportsCount={data.draftReportsCount}
                        upcomingSchedules={data.upcomingSchedules}
                        schedulingEnabled={data.features.scheduling}
                      />
                    </DashboardPanel>
                  </div>
                  {showCriticalAlerts ? (
                    <div className="lg:col-span-12">
                      <DashboardPanel
                        title="Recent alerts"
                        description="Critical risks and incidents requiring attention."
                        contentClassName="p-3"
                      >
                        <DashboardCriticalAlerts alerts={data.criticalAlerts} />
                      </DashboardPanel>
                    </div>
                  ) : null}
                </div>
              ),
            },
            {
              id: "intelligence",
              label: "Intelligence",
              badge: opsTaskCount > 0 ? opsTaskCount : null,
              content: (
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-12">
                  <div className="lg:col-span-8">
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
                  <div className="lg:col-span-4">
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
                    <div className="lg:col-span-4">
                      <DashboardPanel
                        title="AI Operational Tasks"
                        description="Incidents and risks requiring analyst attention."
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
                  <div className="lg:col-span-4">
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
                  <div className="lg:col-span-4">
                    <DashboardPanel
                      title="Executive Reports"
                      description="Leadership deliverables, confidence, and compliance trends."
                    >
                      <DashboardExecutiveReportsOverview metrics={data.executiveReportMetrics} />
                    </DashboardPanel>
                  </div>
                  <div className="lg:col-span-6">
                    <DashboardPanel
                      title="AI Insights"
                      description="Incident assistant analyses and confidence trends."
                    >
                      <DashboardIncidentAIOverview
                        metrics={data.incidentAIMetrics}
                        aiEnabled={incidentAiAccess.allowed}
                        upgradeMessage={getFeatureUpgradeMessage("ai_incident_assistant")}
                      />
                    </DashboardPanel>
                  </div>
                  <div className="lg:col-span-6">
                    <DashboardPanel
                      title="AI Risk Insights"
                      description="Risk assistant analyses and mitigation confidence."
                    >
                      <DashboardRiskAIOverview
                        metrics={data.riskAIMetrics}
                        aiEnabled={riskAiAccess.allowed}
                        upgradeMessage={getFeatureUpgradeMessage("ai_risk_assistant")}
                      />
                    </DashboardPanel>
                  </div>
                </div>
              ),
            },
            {
              id: "automation",
              label: "Automation",
              badge: opsAutomationBadge > 0 ? opsAutomationBadge : null,
              urgent: opsAutomationBadge > 0,
              content: (
                <div className={opsPanelGrid}>
                  <div className="lg:col-span-4">
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
                  <div className="lg:col-span-4">
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
                  <div className="lg:col-span-4">
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
                  <div className="lg:col-span-6">
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
                  <div className="lg:col-span-6">
                    <DashboardPanel
                      title="Monitoring"
                      description="Connector health and operational signals."
                    >
                      <DashboardMonitoringOverview metrics={data.monitoringMetrics} />
                    </DashboardPanel>
                  </div>
                </div>
              ),
            },
            {
              id: "governance",
              label: "Governance",
              badge: opsComplianceBadge > 0 ? opsComplianceBadge : null,
              urgent: opsComplianceBadge > 0,
              content: (
                <div className={opsPanelGrid}>
                  {platformStatus ? (
                    <div className="lg:col-span-4">
                      <DashboardPanel
                        title="Platform status"
                        description="Infrastructure, cron, queue, and observability."
                        variant="glass"
                      >
                        <PlatformStatusWidget snapshot={platformStatus} />
                      </DashboardPanel>
                    </div>
                  ) : null}
                  {canManageCompliance && complianceSummary ? (
                    <div className="lg:col-span-8">
                      <DashboardPanel
                        title="Compliance & Governance"
                        description="Workspace maturity and audit activity — not certification status."
                        action={
                          <Link href="/dashboard/compliance" className={cn(linkText, "text-xs")}>
                            Open center
                          </Link>
                        }
                        variant="glass"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-border/70 bg-surface/60 p-3">
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                              Framework maturity
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-foreground">
                              {complianceSummary.frameworkReadinessPercent}%
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              Workspace evidence coverage — not certification
                            </p>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-surface/60 p-3">
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
                          <div className="rounded-lg border border-border/70 bg-surface/60 p-3">
                            <p className="text-sm text-muted">Open GDPR requests</p>
                            <p className="mt-2 text-2xl font-semibold text-foreground">
                              {complianceSummary.openGdprRequests}
                            </p>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-surface/60 p-3">
                            <p className="text-sm text-muted">Security incidents</p>
                            <p className="mt-2 text-2xl font-semibold text-foreground">
                              {complianceSummary.openSecurityIncidents}
                            </p>
                          </div>
                        </div>
                      </DashboardPanel>
                    </div>
                  ) : null}
                  {data.features.sla ? (
                    <div className="lg:col-span-6">
                      <DashboardPanel title="SLA overview">
                        <DashboardSlaOverview metrics={data.slaMetrics} />
                      </DashboardPanel>
                    </div>
                  ) : null}
                  {data.features.escalation ? (
                    <div className="lg:col-span-6">
                      <DashboardPanel title="Escalation overview">
                        <DashboardEscalationOverview metrics={data.escalationMetrics} />
                      </DashboardPanel>
                    </div>
                  ) : null}
                  <div className="lg:col-span-12">
                    <DashboardPanel
                      title="Recent activity"
                      description="Latest movement across your workspace."
                      action={
                        <Link href="/activity" className={cn(linkText, "text-xs")}>
                          View all
                        </Link>
                      }
                    >
                      <DashboardActivityTimeline events={data.recentActivity} />
                    </DashboardPanel>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}

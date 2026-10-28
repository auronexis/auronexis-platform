import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  DollarSign,
  FileText,
  Percent,
  ShieldAlert,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
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
import { DashboardBusinessUpgradeCard } from "@/components/dashboard/dashboard-business-upgrade-card";
import { DashboardCriticalAlerts } from "@/components/dashboard/dashboard-critical-alerts";
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
import {
  DashboardUpgradeMetricCard,
} from "@/components/dashboard/dashboard-upgrade-cards";
import { ReportsQueueCard } from "@/components/dashboard/reports-queue-card";
import { SystemHealthCard } from "@/components/dashboard/system-health-card";
import { SectionTitle } from "@/components/ui/typography";
import { requireSession } from "@/lib/auth/session";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { OperationsCenter } from "@/components/dashboard/operations-center";
import { LazyOpsTabPanel } from "@/components/dashboard/lazy-ops-tab-panel";
import {
  OpsAiTasksSummary,
  OpsAutomationTabBadge,
  OpsGovernanceTabBadge,
  OpsIntelligenceTabBadge,
  StreamedWorkspaceHealthPercent,
} from "@/components/dashboard/dashboard-ops-streamed-metrics";
import { OpsTabPanelErrorBoundary } from "@/components/dashboard/ops-tab-panel-error-boundary";
import { getDashboardData } from "@/lib/dashboard/queries";
import { computeHealthScore } from "@/lib/dashboard/display";
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
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { checkPlanFeatureForSession } from "@/lib/plans";
import { formatCurrency, formatMargin } from "@/lib/profitability/types";
import { getStoredOrganizationCurrency } from "@/lib/i18n";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { listPendingInvitations, listTeamMembers } from "@/lib/team/queries";
import { cn } from "@/lib/utils/cn";
import { focusRing, linkText } from "@/lib/ui/tokens";
import { startPhaseTimer } from "@/lib/observability/phase-timer";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const timer = startPhaseTimer();
  const session = await requireSession();
  const currency = getStoredOrganizationCurrency(session.organization);
  const data = await getDashboardData(session);
  timer.mark("data");
  // Intelligence / Automation / Governance tabs load on demand (LazyOpsTabPanel), so only the
  // plan checks needed for the visible page run here.
  const [
    executiveIntelligence,
    aiAccess,
    operationalAiAccess,
    automationAccess,
    teamMembers,
    pendingInvitations,
    planContext,
  ] = await Promise.all([
    getExecutiveIntelligence(session, data),
    checkPlanFeatureForSession(session, "ai_report_assistant"),
    checkPlanFeatureForSession(session, "ai_risk_assistant"),
    checkPlanFeatureForSession(session, "ai_automation_builder"),
    listTeamMembers(session).catch(() => []),
    listPendingInvitations(session).catch(() => []),
    getOrganizationPlanContextForSession(session).catch(() => null),
  ]);

  const canManageCompliance = canManageOrganizationSettings(session);
  const canReadCustomerSuccess = sessionHasPermission(session, "customer_success.read");

  // Ops-tab-only hubs load via Suspense (intelligence / automation / governance).
  // Known limitation: no cheap knowledge count/head API on the blocking path —
  // activation/adoption/guidance use knowledgeHub: null (knowledge steps may under-count).
  // Full hub still loads inside the Automation tab panel.
  const guidanceInput = {
    data,
    teamMemberCount: teamMembers.length || 1,
    pendingInvitationCount: pendingInvitations.length,
    knowledgeHub: null,
    planContext,
    session,
  };

  const opsStreamAccess = {
    operationalAiAccess: operationalAiAccess.allowed,
    automationAccess: automationAccess.allowed,
    canManageCompliance,
  };

  // Start customer-success portfolio in parallel with activation (independent).
  const customerSuccessPortfolioPromise = canReadCustomerSuccess
    ? buildCustomerSuccessPortfolio({ session, planContext })
    : Promise.resolve(null);

  timer.mark("context");
  const activation = await buildActivationSnapshot({
    session,
    planContext,
    teamMemberCount: teamMembers.length || 1,
    pendingInvitationCount: pendingInvitations.length,
    knowledgeHub: null,
    openRiskCount: data.openRiskCount,
    monitoringConnectorCount: data.monitoringMetrics.activeConnectors,
  });

  timer.mark("activation");
  const [adoption, smartRecommendations, customerSuccessPortfolio] = await Promise.all([
    buildAdoptionSnapshot({
      session,
      planContext,
      teamMemberCount: teamMembers.length || 1,
      pendingInvitationCount: pendingInvitations.length,
      knowledgeHub: null,
      openRiskCount: data.openRiskCount,
      monitoringConnectorCount: data.monitoringMetrics.activeConnectors,
      activation,
    }),
    buildSmartRecommendations(guidanceInput),
    customerSuccessPortfolioPromise,
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
  timer.mark("guidance");
  timer.logIfSlow("/dashboard");
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
        workspaceHealthValue={
          <Suspense fallback={<>{computeHealthScore(data.clientHealth)}%</>}>
            <StreamedWorkspaceHealthPercent
              aiAccess={aiAccess.allowed}
              fallbackPercent={computeHealthScore(data.clientHealth)}
            />
          </Suspense>
        }
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
                trend={
                  data.clientHealth.totalClients > 0
                    ? `Across ${data.clientHealth.totalClients} active client${data.clientHealth.totalClients === 1 ? "" : "s"}`
                    : "No active clients yet"
                }
                tone="success"
                size="compact"
              />
              <DashboardMetricCard
                label="Monthly profit"
                value={formatCurrency(data.businessMetrics.monthlyProfit, currency)}
                icon={TrendingUp}
                trend={`After ${formatCurrency(data.businessMetrics.monthlyCost, currency)} costs`}
                tone={data.businessMetrics.monthlyProfit < 0 ? "danger" : "success"}
                size="compact"
              />
              <DashboardMetricCard
                label="Average margin"
                value={formatMargin(data.businessMetrics.averageMargin)}
                icon={Percent}
                trend={data.businessMetrics.averageMargin === null ? "No financials yet" : "Average per client"}
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
            trend={data.draftReportsCount > 0 ? "Awaiting review" : "No drafts open"}
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
              <Suspense fallback={null}>
                <OpsAiTasksSummary access={opsStreamAccess} />
              </Suspense>
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
              badge: (
                <Suspense fallback={null}>
                  <OpsIntelligenceTabBadge access={opsStreamAccess} />
                </Suspense>
              ),
              content: (
                <OpsTabPanelErrorBoundary panelLabel="Intelligence">
                  <LazyOpsTabPanel tab="intelligence" panelLabel="Intelligence" />
                </OpsTabPanelErrorBoundary>
              ),
            },
            {
              id: "automation",
              label: "Automation",
              badge: (
                <Suspense fallback={null}>
                  <OpsAutomationTabBadge access={opsStreamAccess} />
                </Suspense>
              ),
              content: (
                <OpsTabPanelErrorBoundary panelLabel="Automation">
                  <LazyOpsTabPanel tab="automation" panelLabel="Automation" />
                </OpsTabPanelErrorBoundary>
              ),
            },
            {
              id: "governance",
              label: "Governance",
              badge: (
                <Suspense fallback={null}>
                  <OpsGovernanceTabBadge access={opsStreamAccess} />
                </Suspense>
              ),
              content: (
                <OpsTabPanelErrorBoundary panelLabel="Governance">
                  <LazyOpsTabPanel tab="governance" panelLabel="Governance" />
                </OpsTabPanelErrorBoundary>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}

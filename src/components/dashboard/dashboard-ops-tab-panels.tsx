import Link from "next/link";
import { Shield, ShieldCheck } from "lucide-react";
import { AIInsightsCard } from "@/components/dashboard/ai-insights-card";
import { CustomerSuccessDashboardCard } from "@/components/clients/success/clients-success-workspace";
import { OperationalTasksCard } from "@/components/dashboard/operational-tasks-card";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DashboardEscalationOverview } from "@/components/dashboard/dashboard-escalation-overview";
import { DashboardSlaOverview } from "@/components/dashboard/dashboard-sla-overview";
import { DashboardActivityTimeline } from "@/components/dashboard/dashboard-activity-timeline";
import { PlatformStatusWidget } from "@/components/dashboard/platform-status-widget";
import { AutomationCenterDashboardClient } from "@/components/automation/automation-center-dashboard-client";
import { IntegrationsHubCard } from "@/components/automation/integrations-hub-card";
import { IntegrationRuntimeHubCard } from "@/components/automation/integration-runtime-hub-card";
import { PredictiveForecastHubCard } from "@/components/predictive/predictive-forecast-hub-card";
import { KnowledgeHubCard } from "@/components/knowledge/knowledge-hub-card";
import { DashboardMonitoringOverview } from "@/components/monitoring/dashboard-monitoring-overview";
import { DashboardIncidentAIOverview } from "@/components/incidents/ai/dashboard-incident-ai-overview";
import { DashboardRiskAIOverview } from "@/components/ai-risks/dashboard-risk-ai-overview";
import { DashboardExecutiveReportsOverview } from "@/components/executive-reports/dashboard-executive-reports-overview";
import { LoadingCard } from "@/components/ui/loading-card";
import { requireSession } from "@/lib/auth/session";
import { buildOperationalTasks } from "@/lib/ai/operational/tasks";
import { getKnowledgeHubData } from "@/lib/ai/knowledge/get-hub";
import { getOperationalIntelligence } from "@/lib/ai/insights/get-intelligence";
import { getClientSuccessPortfolio } from "@/lib/ai/client-success/get-analysis";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getIntegrationsDashboardSummary, getIntegrationRuntimeSummary } from "@/lib/integrations/queries";
import { getPredictiveDashboardSummary } from "@/lib/predictive/cache";
import { getComplianceDiagnosticsSnapshot } from "@/lib/compliance/diagnostics";
import { getPlatformStatusSnapshot } from "@/lib/diagnostics/platform-status";
import {
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

export function OpsTabPanelSkeleton() {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-12" aria-busy="true">
      <div className="lg:col-span-8">
        <LoadingCard lines={4} />
      </div>
      <div className="lg:col-span-4">
        <LoadingCard lines={3} />
      </div>
      <div className="lg:col-span-4">
        <LoadingCard lines={3} />
      </div>
      <div className="lg:col-span-4">
        <LoadingCard lines={3} />
      </div>
    </div>
  );
}

type OpsTabAccess = {
  aiAccess: boolean;
  successAccess: boolean;
  operationalAiAccess: boolean;
  incidentAiAccess: boolean;
  riskAiAccess: boolean;
  automationAccess: boolean;
  predictiveAccess: boolean;
  knowledgeAccess: boolean;
  canManageCompliance: boolean;
};

export async function DashboardOpsIntelligenceTab({ access }: { access: OpsTabAccess }) {
  const session = await requireSession();
  const data = await getDashboardData(session);

  const [intelligence, successPortfolio, operationalTasks, predictiveSummary] = await Promise.all([
    access.aiAccess ? getOperationalIntelligence(session, data) : Promise.resolve(null),
    access.successAccess ? getClientSuccessPortfolio(session) : Promise.resolve(null),
    (data.features.risks || data.features.incidents) && access.operationalAiAccess
      ? buildOperationalTasks(session)
      : Promise.resolve(null),
    access.predictiveAccess ? getPredictiveDashboardSummary(session) : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <DashboardPanel
          title="AI Insights"
          description="Operational trends, risks, and recommended actions from verified data."
          action={
            access.aiAccess ? (
              <Link href="/dashboard/insights" className={cn(linkText, "text-xs")}>
                View all
              </Link>
            ) : null
          }
          variant="glass"
        >
          <AIInsightsCard
            insights={intelligence?.insights ?? []}
            aiEnabled={access.aiAccess}
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
            access.successAccess ? (
              <Link href="/clients/success" className={cn(linkText, "text-xs")}>
                View all
              </Link>
            ) : null
          }
        >
          <CustomerSuccessDashboardCard
            highlights={successPortfolio?.highlights ?? []}
            aiEnabled={access.successAccess}
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
              aiEnabled={access.operationalAiAccess}
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
            access.predictiveAccess ? (
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
            aiEnabled={access.predictiveAccess}
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
            aiEnabled={access.incidentAiAccess}
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
            aiEnabled={access.riskAiAccess}
            upgradeMessage={getFeatureUpgradeMessage("ai_risk_assistant")}
          />
        </DashboardPanel>
      </div>
    </div>
  );
}

export async function DashboardOpsAutomationTab({ access }: { access: OpsTabAccess }) {
  const session = await requireSession();
  const data = await getDashboardData(session);

  const [knowledgeHub, integrationsSummary, integrationRuntimeSummary] = await Promise.all([
    access.knowledgeAccess ? getKnowledgeHubData(session) : Promise.resolve(null),
    access.automationAccess
      ? getIntegrationsDashboardSummary({
          organizationId: session.organization.id,
          userId: session.user.id,
        })
      : Promise.resolve(null),
    access.automationAccess
      ? getIntegrationRuntimeSummary({
          organizationId: session.organization.id,
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <DashboardPanel
          title="Automation Center"
          description="Running workflows, errors, and recent triggers."
          action={
            access.automationAccess ? (
              <Link href="/automation" className={cn(linkText, "text-xs")}>
                View all
              </Link>
            ) : null
          }
          variant="glass"
        >
          <AutomationCenterDashboardClient
            organizationId={session.organization.id}
            aiEnabled={access.automationAccess}
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
            access.automationAccess ? (
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
            aiEnabled={access.automationAccess}
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
            access.automationAccess ? (
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
            aiEnabled={access.automationAccess}
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
            access.knowledgeAccess ? (
              <Link href="/knowledge" className={cn(linkText, "text-xs")}>
                View all
              </Link>
            ) : null
          }
          variant="glass"
        >
          <KnowledgeHubCard
            data={knowledgeHub}
            aiEnabled={access.knowledgeAccess}
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
  );
}

export async function DashboardOpsGovernanceTab({ access }: { access: OpsTabAccess }) {
  const session = await requireSession();
  const data = await getDashboardData(session);

  const [complianceSummary, platformStatus] = await Promise.all([
    access.canManageCompliance ? getComplianceDiagnosticsSnapshot(session) : Promise.resolve(null),
    access.canManageCompliance ? getPlatformStatusSnapshot() : Promise.resolve(null),
  ]);

  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-12">
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
      {access.canManageCompliance && complianceSummary ? (
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
  );
}

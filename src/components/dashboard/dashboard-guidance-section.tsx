import { ActivationPanel } from "@/components/activation/activation-panel";
import { AdoptionSummaryPanel } from "@/components/adoption/adoption-summary-panel";
import { CustomerSuccessSummaryPanel } from "@/components/customer-success/customer-success-summary-panel";
import { CustomerSuccessTracker } from "@/components/customer-success/customer-success-tracker";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { SmartRecommendations } from "@/components/dashboard/smart-recommendations";
import { ExecutiveIntelligenceSummaryPanel } from "@/components/executive-intelligence/executive-intelligence-summary-panel";
import { ExecutiveIntelligenceTracker } from "@/components/executive-intelligence/executive-intelligence-tracker";
import { LoadingCard } from "@/components/ui/loading-card";
import { SectionTitle } from "@/components/ui/typography";
import type { ActivationSnapshot } from "@/lib/activation/types";
import type { AdoptionSnapshot, DashboardGuidanceMode } from "@/lib/adoption/types";
import { requireSession } from "@/lib/auth/session";
import { sessionHasPermission } from "@/lib/authorization/guards";
import {
  buildCustomerSuccessPortfolio,
  resolveDashboardCustomerSuccessMode,
} from "@/lib/customer-success/snapshot";
import type { DashboardData } from "@/lib/dashboard/types";
import type { SmartRecommendation } from "@/lib/dashboard/workspace-guidance";
import {
  buildExecutiveIntelligenceSnapshot,
  resolveDashboardExecutiveIntelligenceMode,
} from "@/lib/executive-intelligence/snapshot";
import { startPhaseTimer } from "@/lib/observability/phase-timer";
import type { OrganizationPlanContext } from "@/lib/plans/types";
import { focusRing } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type DashboardGuidanceSectionProps = {
  data: DashboardData;
  planContext: OrganizationPlanContext | null;
  activation: ActivationSnapshot;
  adoption: AdoptionSnapshot;
  smartRecommendations: SmartRecommendation[];
  guidanceMode: DashboardGuidanceMode;
  canDismissActivation: boolean;
};

/** Placeholder while the guidance section streams in. */
export function DashboardGuidanceSkeleton() {
  return <LoadingCard lines={2} />;
}

/**
 * Workspace guidance: quick actions, activation/adoption, customer-success and executive
 * summaries. Streamed with Suspense because the customer-success portfolio builds one
 * snapshot per client and used to hold back the whole dashboard.
 *
 * While activation is incomplete or adoption is at risk, the customer-success and executive
 * panels are never shown (their modes resolve to "hidden"), so they are not built at all.
 */
export async function DashboardGuidanceSection({
  data,
  planContext,
  activation,
  adoption,
  smartRecommendations,
  guidanceMode,
  canDismissActivation,
}: DashboardGuidanceSectionProps) {
  const timer = startPhaseTimer();
  const session = await requireSession();
  const showsInsightPanels =
    guidanceMode !== "activation_primary" && guidanceMode !== "adoption_risk";
  const canReadCustomerSuccess = sessionHasPermission(session, "customer_success.read");
  const canReadExecutiveIntelligence = sessionHasPermission(session, "executive_intelligence.read");

  const customerSuccessPortfolio =
    showsInsightPanels && canReadCustomerSuccess
      ? await buildCustomerSuccessPortfolio({ session, planContext })
      : null;
  timer.mark("portfolio");

  const customerSuccessMode = customerSuccessPortfolio
    ? resolveDashboardCustomerSuccessMode(activation, adoption, customerSuccessPortfolio)
    : "hidden";

  const executiveSnapshot =
    showsInsightPanels && canReadExecutiveIntelligence
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
  timer.mark("executive");
  timer.logIfSlow("/dashboard#guidance");

  const executiveIntelligenceMode =
    executiveSnapshot && customerSuccessMode !== "critical"
      ? resolveDashboardExecutiveIntelligenceMode(
          activation,
          adoption,
          customerSuccessMode,
          executiveSnapshot,
        )
      : "hidden";

  const guidanceNeedsAttention =
    guidanceMode === "activation_primary" ||
    guidanceMode === "adoption_risk" ||
    customerSuccessMode === "critical" ||
    executiveIntelligenceMode === "critical";
  const guidanceCompact = !guidanceNeedsAttention;

  return (
    <>
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
    </>
  );
}

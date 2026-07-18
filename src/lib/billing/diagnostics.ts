import "server-only";

import { getDefaultPlanKey } from "@/lib/plans/features";
import { getOrganizationPlanContext } from "@/lib/plans/queries";
import type { BillingDiagnosticsSnapshot } from "@/lib/billing/types";
import { BILLING_PLATFORM_VERSION } from "@/lib/billing/types";
import {
  countCustomerInvoices,
  countRecentBillingEvents,
} from "@/lib/billing/invoices";
import { getBillingOverview } from "@/lib/billing/queries";
import { getCurrentUsageSummary } from "@/lib/billing/usage";
import { checkPaddleHealth } from "@/lib/diagnostics/platform-health";
import type { SessionContext } from "@/lib/tenancy/context";

export async function getBillingDiagnosticsSnapshot(
  session: SessionContext,
): Promise<BillingDiagnosticsSnapshot> {
  const [overview, plan, usage, invoiceCount, webhookEventsLast7Days] = await Promise.all([
    getBillingOverview(session),
    getOrganizationPlanContext(session.organization.id),
    getCurrentUsageSummary(session),
    countCustomerInvoices(session.organization.id),
    countRecentBillingEvents(session.organization.id, 7),
  ]);

  const stripeHealth = checkPaddleHealth();
  const approachingLimits = usage.metrics.filter((metric) => metric.approachingLimit).length;
  const reachedLimits = usage.metrics.filter((metric) => metric.atLimit).length;

  let forecastStatus: BillingDiagnosticsSnapshot["forecastStatus"] = "healthy";
  if (reachedLimits > 0) {
    forecastStatus = "critical";
  } else if (approachingLimits > 0) {
    forecastStatus = "warning";
  }

  return {
    platformVersion: BILLING_PLATFORM_VERSION,
    currentPlanKey: overview.currentPlanKey ?? plan.planKey ?? getDefaultPlanKey(),
    subscriptionState: overview.subscription?.status ?? null,
    stripeConnected: stripeHealth.ok,
    usageMeteringEnabled: true,
    invoiceCount,
    webhookEventsLast7Days,
    upcomingRenewal: overview.renewalDate,
    forecastStatus,
    approachingLimits,
    reachedLimits,
  };
}

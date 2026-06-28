import { buildBillingOverview } from "@/lib/billing/types";
import type { BillingDashboardData, BillingOverview } from "@/lib/billing/types";
import { getPlanByKey } from "@/lib/billing/plans";
import { getPlanByPriceId } from "@/lib/billing/plans.server";
import { listActiveDiscountPreviews } from "@/lib/billing/discounts";
import { listCustomerInvoices } from "@/lib/billing/invoices";
import { listProrationPreviews } from "@/lib/billing/proration";
import { getCurrentUsageSummary } from "@/lib/billing/usage";
import { isActiveSubscriptionStatus } from "@/lib/stripe/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationSubscription } from "@/types/database";
import { getDefaultPlanKey } from "@/lib/plans/features";

const SUBSCRIPTION_SELECT =
  "id, organization_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, cancel_at_period_end, trial_ends_at, created_at, updated_at";

/** Load the current organization's subscription record. */
export async function getOrganizationSubscription(
  session: SessionContext,
): Promise<OrganizationSubscription | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select(SUBSCRIPTION_SELECT)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as OrganizationSubscription | null) ?? null;
}

/** Billing overview for settings UI. */
export async function getBillingOverview(session: SessionContext): Promise<BillingOverview> {
  const subscription = await getOrganizationSubscription(session);
  const isActive = Boolean(
    subscription?.status && isActiveSubscriptionStatus(subscription.status),
  );
  const currentPlan =
    isActive && subscription?.stripe_price_id
      ? getPlanByPriceId(subscription.stripe_price_id)
      : null;
  const starterPlan = getPlanByKey("starter");

  return buildBillingOverview(
    subscription,
    session.organization.plan,
    currentPlan?.name ?? starterPlan.name,
    currentPlan?.key ?? null,
  );
}

/** Full billing dashboard payload for settings UI. */
export async function getBillingDashboardData(
  session: SessionContext,
): Promise<BillingDashboardData> {
  const [overview, usage, invoices] = await Promise.all([
    getBillingOverview(session),
    getCurrentUsageSummary(session),
    listCustomerInvoices(session),
  ]);

  const currentPlanKey = overview.currentPlanKey ?? getDefaultPlanKey();
  const [discounts, prorationPreviews] = await Promise.all([
    listActiveDiscountPreviews(currentPlanKey),
    Promise.resolve(
      listProrationPreviews({
        currentPlanKey,
        periodStart: overview.subscription?.current_period_start ?? null,
        periodEnd: overview.subscription?.current_period_end ?? null,
      }),
    ),
  ]);

  const approaching = usage.metrics.filter((metric) => metric.approachingLimit).length;
  const reached = usage.metrics.filter((metric) => metric.atLimit).length;
  const forecastStatus =
    reached > 0 ? "critical" : approaching > 0 ? "warning" : "healthy";

  return {
    overview,
    usage,
    limits: usage.metrics.filter((metric) => metric.limit !== null),
    invoices,
    discounts,
    prorationPreviews,
    forecastStatus,
  };
}

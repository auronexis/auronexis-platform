import { buildBillingOverview } from "@/lib/billing/types";
import type { BillingDashboardData, BillingOverview, CustomerInvoiceView } from "@/lib/billing/types";
import { listActiveDiscountPreviews } from "@/lib/billing/discounts";
import { filterCustomerFacingInvoices } from "@/lib/billing/hygiene";
import { listCustomerInvoices } from "@/lib/billing/invoices";
import { listProrationPreviews } from "@/lib/billing/proration";
import { getCurrentUsageSummary } from "@/lib/billing/usage";
import {
  maskStripePriceId,
  safeGetPlanByStripePriceId,
  safeGetPlanKeyByStripePriceId,
} from "@/lib/billing/plans.server";
import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import {
  isPaymentPending,
  isPaymentProblem,
  isSubscriptionUsable,
} from "@/lib/billing/status";
import { ensureSubscriptionCustomer, subscriptionRequiresCustomerId } from "@/lib/stripe/customers";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationSubscription } from "@/types/database";
import { getDefaultPlanKey } from "@/lib/plans/features";
import { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";

export { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";

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
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return selectPreferredSubscriptionRow((data ?? []) as OrganizationSubscription[]);
}

/** Billing overview for settings UI. */
export async function getBillingOverview(session: SessionContext): Promise<BillingOverview> {
  let subscription = await getOrganizationSubscription(session);

  if (
    subscription &&
    subscriptionRequiresCustomerId(subscription.status) &&
    !subscription.stripe_customer_id
  ) {
    await ensureSubscriptionCustomer({
      organizationId: session.organization.id,
      organizationName: session.organization.name,
      email: session.email,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripe_subscription_id,
    });
    subscription = await getOrganizationSubscription(session);
  }

  const rawStatus = subscription?.status;
  const stripePriceId = subscription?.stripe_price_id ?? null;
  const showPlanFromSubscription =
    Boolean(stripePriceId) &&
    (isSubscriptionUsable(rawStatus) ||
      isPaymentProblem(rawStatus) ||
      isPaymentPending(rawStatus));
  const currentPlan =
    showPlanFromSubscription && stripePriceId
      ? safeGetPlanByStripePriceId(stripePriceId)
      : null;

  if (showPlanFromSubscription && stripePriceId && !currentPlan) {
    console.warn("[billing] Unmapped stripe_price_id for subscription", {
      maskedPriceId: maskStripePriceId(stripePriceId),
      status: rawStatus ?? null,
    });
  }

  const resolvedPlanKey = stripePriceId ? safeGetPlanKeyByStripePriceId(stripePriceId) : null;
  const displayPlanKey =
    isSubscriptionUsable(rawStatus) && resolvedPlanKey ? resolvedPlanKey : currentPlan?.key ?? null;

  return buildBillingOverview(
    subscription,
    session.organization.plan,
    currentPlan?.name ?? null,
    displayPlanKey,
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
    invoices: filterCustomerFacingInvoices(invoices),
    discounts,
    prorationPreviews,
    forecastStatus,
  };
}

export type PlansPageBillingState = {
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
  resolvedPlanKey: PlanKey | null;
  currentPlanKey: PlanKey | null;
  currentPlan: ReturnType<typeof safeGetPlanByKey>;
  currentPlanName: string | null;
};

/** Billing state for /settings/plans — same subscription source as diagnostics, never throws. */
export async function getPlansPageBillingState(
  session: SessionContext,
): Promise<PlansPageBillingState> {
  const fallbackOverview = buildBillingOverview(null, "starter", null, null);

  try {
    let subscription: OrganizationSubscription | null = null;

    try {
      subscription = await getOrganizationSubscription(session);
    } catch (error) {
      console.warn("[plans] subscription query failed — continuing without subscription row", {
        organizationId: session.organization.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const rawStatus = subscription?.status ?? null;
    const stripePriceId = subscription?.stripe_price_id ?? null;
    const resolvedPlanKey = stripePriceId ? safeGetPlanKeyByStripePriceId(stripePriceId) : null;

    if (stripePriceId && !resolvedPlanKey) {
      console.warn("[plans] Unmapped stripe_price_id", {
        maskedPriceId: maskStripePriceId(stripePriceId),
        subscriptionStatus: rawStatus,
      });
    }

    const showPlanFromSubscription =
      Boolean(stripePriceId) &&
      (isSubscriptionUsable(rawStatus) ||
        isPaymentProblem(rawStatus) ||
        isPaymentPending(rawStatus));
    const mappedPlan =
      showPlanFromSubscription && stripePriceId
        ? safeGetPlanByStripePriceId(stripePriceId)
        : null;
    const displayPlanKey =
      isSubscriptionUsable(rawStatus) && resolvedPlanKey
        ? resolvedPlanKey
        : mappedPlan?.key ?? null;

    const overview = buildBillingOverview(
      subscription,
      "starter",
      mappedPlan?.name ?? null,
      displayPlanKey,
    );

    const currentPlanKey = overview.isUsable && resolvedPlanKey ? resolvedPlanKey : null;
    const currentPlan = currentPlanKey ? safeGetPlanByKey(currentPlanKey) : null;
    const currentPlanName = currentPlan?.name ?? overview.planLabel ?? null;

    let invoices: CustomerInvoiceView[] = [];

    try {
      invoices = filterCustomerFacingInvoices(await listCustomerInvoices(session));
    } catch (error) {
      console.warn("[plans] Failed to load invoices for pricing page", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    console.log("[plans][debug]", {
      organizationId: session.organization.id,
      subscriptionStatus: rawStatus,
      stripePriceId: stripePriceId ? maskStripePriceId(stripePriceId) : null,
      resolvedPlanKey,
      currentPlanKey,
      hasCurrentPlan: Boolean(currentPlan),
      invoicesCount: invoices.length,
      source: "settings/plans",
    });

    return {
      overview: {
        ...overview,
        currentPlanKey: overview.isUsable ? currentPlanKey : overview.currentPlanKey,
        planLabel: overview.isUsable ? (currentPlanName ?? overview.planLabel) : overview.planLabel,
      },
      invoices,
      resolvedPlanKey,
      currentPlanKey: overview.isUsable ? currentPlanKey : null,
      currentPlan,
      currentPlanName,
    };
  } catch (error) {
    console.error("[plans] getPlansPageBillingState failed — returning fallback billing state", {
      organizationId: session.organization.id,
      message: error instanceof Error ? error.message : String(error),
    });

    return {
      overview: fallbackOverview,
      invoices: [],
      resolvedPlanKey: null,
      currentPlanKey: null,
      currentPlan: null,
      currentPlanName: null,
    };
  }
}

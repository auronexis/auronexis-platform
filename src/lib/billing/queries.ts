import { buildBillingOverview } from "@/lib/billing/types";
import type { BillingDashboardData, BillingOverview, CustomerInvoiceView } from "@/lib/billing/types";
import { resolveCheckoutBlockState, type CheckoutBlockState } from "@/lib/billing/checkout-block";
import { listActiveDiscountPreviews } from "@/lib/billing/discounts";
import { listProrationPreviews } from "@/lib/billing/proration";
import { getCurrentUsageSummary } from "@/lib/billing/usage";
import {
  maskStripePriceId,
  safeGetPlanKeyFromSubscriptionPrice,
} from "@/lib/billing/plans.server";
import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationSubscription } from "@/types/database";
import { getDefaultPlanKey } from "@/lib/plans/features";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { resolveActiveBillingStatusFlags } from "@/lib/billing/active-billing";
import { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";
import { listOrganizationBillingTransactions } from "@/lib/paddle/transactions";
import { getPaddleBillingDetails } from "@/lib/paddle/subscription-details";

export { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";

/** Canonical PostgREST select for organization_subscriptions rows. */
export const ORGANIZATION_SUBSCRIPTION_SELECT =
  "id, organization_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, billing_provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status, sync_pending, status, current_period_start, current_period_end, cancel_at_period_end, trial_ends_at, created_at, updated_at";

/** Load the current organization's subscription record for the active billing provider. */
export async function getOrganizationSubscription(
  session: SessionContext,
): Promise<OrganizationSubscription | null> {
  const supabase = await createClient();
  const activeProvider = getActiveBillingProvider();

  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select(ORGANIZATION_SUBSCRIPTION_SELECT)
    .eq("organization_id", session.organization.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return selectPreferredSubscriptionRow(
    (data ?? []) as OrganizationSubscription[],
    activeProvider,
  );
}

/** Billing overview for settings UI. Paddle is the sole active billing provider. */
export async function getBillingOverview(session: SessionContext): Promise<BillingOverview> {
  const activeProvider = getActiveBillingProvider();
  const subscription = await getOrganizationSubscription(session);

  const flags = resolveActiveBillingStatusFlags(subscription, activeProvider);
  const rawStatus = flags.rawStatus;
  const billingProvider =
    activeProvider === "paddle" ? "paddle" : (subscription?.billing_provider ?? "stripe");
  const stripePriceId = activeProvider === "paddle" ? null : (subscription?.stripe_price_id ?? null);
  const providerPriceId = subscription?.provider_price_id ?? null;
  const effectivePriceId =
    billingProvider === "paddle" ? providerPriceId : (stripePriceId ?? providerPriceId);
  const showPlanFromSubscription =
    Boolean(effectivePriceId) &&
    (flags.isUsable || flags.hasPaymentProblem || flags.isPaymentPending);
  const resolvedPlanKey = safeGetPlanKeyFromSubscriptionPrice({
    billingProvider,
    stripePriceId,
    providerPriceId,
  });
  const currentPlan =
    showPlanFromSubscription && resolvedPlanKey ? safeGetPlanByKey(resolvedPlanKey) : null;

  if (showPlanFromSubscription && effectivePriceId && !currentPlan) {
    console.warn("[billing] Unmapped provider price id for subscription", {
      billingProvider,
      maskedPriceId: maskStripePriceId(effectivePriceId),
      status: rawStatus ?? null,
    });
  }

  const displayPlanKey =
    flags.isUsable && resolvedPlanKey ? resolvedPlanKey : currentPlan?.key ?? null;

  return buildBillingOverview(
    subscription,
    session.organization.plan,
    currentPlan?.name ?? null,
    displayPlanKey,
    activeProvider,
  );
}

/** Full billing dashboard payload for settings UI. */
export async function getBillingDashboardData(
  session: SessionContext,
): Promise<BillingDashboardData> {
  const [overview, usage, billingHistory] = await Promise.all([
    getBillingOverview(session),
    getCurrentUsageSummary(session),
    listOrganizationBillingTransactions(session).catch((error) => {
      console.warn("[billing] Failed to load Paddle billing history", {
        organizationId: session.organization.id,
        message: error instanceof Error ? error.message : String(error),
      });
      return [];
    }),
  ]);

  const currentPlanKey = overview.currentPlanKey ?? getDefaultPlanKey();
  const [discounts, prorationPreviews, paddleDetails] = await Promise.all([
    listActiveDiscountPreviews(currentPlanKey),
    Promise.resolve(
      listProrationPreviews({
        currentPlanKey,
        periodStart: overview.subscription?.current_period_start ?? null,
        periodEnd: overview.subscription?.current_period_end ?? null,
      }),
    ),
    getPaddleBillingDetails(session).catch((error) => {
      console.warn("[billing] Failed to load Paddle billing details", {
        organizationId: session.organization.id,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }),
  ]);

  const approaching = usage.metrics.filter((metric) => metric.approachingLimit).length;
  const reached = usage.metrics.filter((metric) => metric.atLimit).length;
  const forecastStatus =
    reached > 0 ? "critical" : approaching > 0 ? "warning" : "healthy";
  const checkoutBlock = resolveCheckoutBlockState({
    overview,
    invoices: [],
    activeProvider: getActiveBillingProvider(),
  });

  return {
    overview,
    usage,
    limits: usage.metrics.filter((metric) => metric.limit !== null),
    invoices: [],
    billingHistory,
    paddleDetails,
    discounts,
    prorationPreviews,
    forecastStatus,
    checkoutBlock,
  };
}

export type PlansPageBillingState = {
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
  resolvedPlanKey: PlanKey | null;
  currentPlanKey: PlanKey | null;
  currentPlan: ReturnType<typeof safeGetPlanByKey>;
  currentPlanName: string | null;
  checkoutBlock: CheckoutBlockState;
  ignoredStripeInvoiceIds: ReadonlySet<string>;
};

/** Billing state for /settings/plans — same subscription source as diagnostics, never throws. */
export async function getPlansPageBillingState(
  session: SessionContext,
): Promise<PlansPageBillingState> {
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

    const activeProvider = getActiveBillingProvider();
    const flags = resolveActiveBillingStatusFlags(subscription, activeProvider);
    const rawStatus = flags.rawStatus;
    const billingProvider =
      activeProvider === "paddle" ? "paddle" : (subscription?.billing_provider ?? "stripe");
    const stripePriceId =
      activeProvider === "paddle" ? null : (subscription?.stripe_price_id ?? null);
    const providerPriceId = subscription?.provider_price_id ?? null;
    const effectivePriceId =
      billingProvider === "paddle" ? providerPriceId : (stripePriceId ?? providerPriceId);
    const resolvedPlanKey = safeGetPlanKeyFromSubscriptionPrice({
      billingProvider,
      stripePriceId,
      providerPriceId,
    });

    if (effectivePriceId && !resolvedPlanKey) {
      console.warn("[plans] Unmapped provider price id", {
        billingProvider,
        maskedPriceId: maskStripePriceId(effectivePriceId),
        subscriptionStatus: rawStatus,
      });
    }

    const showPlanFromSubscription =
      Boolean(effectivePriceId) &&
      (flags.isUsable || flags.hasPaymentProblem || flags.isPaymentPending);
    const mappedPlan =
      showPlanFromSubscription && resolvedPlanKey ? safeGetPlanByKey(resolvedPlanKey) : null;
    const displayPlanKey =
      flags.isUsable && resolvedPlanKey ? resolvedPlanKey : mappedPlan?.key ?? null;

    const overview = buildBillingOverview(
      subscription,
      "starter",
      mappedPlan?.name ?? null,
      displayPlanKey,
      activeProvider,
    );

    const currentPlanKey = overview.isUsable && resolvedPlanKey ? resolvedPlanKey : null;
    const currentPlan = currentPlanKey ? safeGetPlanByKey(currentPlanKey) : null;
    const currentPlanName = currentPlan?.name ?? overview.planLabel ?? null;

    const checkoutBlock = resolveCheckoutBlockState({
      overview,
      invoices: [],
      activeProvider,
    });

    return {
      overview: {
        ...overview,
        currentPlanKey: overview.isUsable ? currentPlanKey : overview.currentPlanKey,
        planLabel: overview.isUsable ? (currentPlanName ?? overview.planLabel) : overview.planLabel,
      },
      invoices: [],
      resolvedPlanKey,
      currentPlanKey: overview.isUsable ? currentPlanKey : null,
      currentPlan,
      currentPlanName,
      checkoutBlock,
      ignoredStripeInvoiceIds: new Set<string>(),
    };
  } catch (error) {
    console.error("[plans] getPlansPageBillingState failed — returning fallback billing state", {
      organizationId: session.organization.id,
      message: error instanceof Error ? error.message : String(error),
    });

    const activeProvider = getActiveBillingProvider();
    const fallbackOverview = buildBillingOverview(null, "starter", null, null, activeProvider);
    return {
      overview: fallbackOverview,
      invoices: [],
      resolvedPlanKey: null,
      currentPlanKey: null,
      currentPlan: null,
      currentPlanName: null,
      checkoutBlock: resolveCheckoutBlockState({
        overview: fallbackOverview,
        invoices: [],
        activeProvider,
      }),
      ignoredStripeInvoiceIds: new Set<string>(),
    };
  }
}

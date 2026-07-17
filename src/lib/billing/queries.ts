import { buildBillingOverview } from "@/lib/billing/types";
import type { BillingDashboardData, BillingOverview, CustomerInvoiceView } from "@/lib/billing/types";
import { resolveCheckoutBlockState, type CheckoutBlockState } from "@/lib/billing/checkout-block";
import { listIgnoredStripeInvoiceIds } from "@/lib/billing/invoices";
import { listActiveDiscountPreviews } from "@/lib/billing/discounts";
import { filterCustomerFacingInvoices } from "@/lib/billing/hygiene";
import { listCustomerInvoices } from "@/lib/billing/invoices";
import { listProrationPreviews } from "@/lib/billing/proration";
import { getCurrentUsageSummary } from "@/lib/billing/usage";
import {
  maskStripePriceId,
  safeGetPlanKeyFromSubscriptionPrice,
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
  "id, organization_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, billing_provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status, sync_pending, status, current_period_start, current_period_end, cancel_at_period_end, trial_ends_at, created_at, updated_at";

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
  const billingProvider = subscription?.billing_provider ?? "stripe";
  const stripePriceId = subscription?.stripe_price_id ?? null;
  const providerPriceId = subscription?.provider_price_id ?? null;
  const effectivePriceId =
    billingProvider === "paddle" ? providerPriceId : (stripePriceId ?? providerPriceId);
  const showPlanFromSubscription =
    Boolean(effectivePriceId) &&
    (isSubscriptionUsable(rawStatus) ||
      isPaymentProblem(rawStatus) ||
      isPaymentPending(rawStatus));
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
  const ignoredStripeInvoiceIds = await listIgnoredStripeInvoiceIds(session.organization.id);
  const checkoutBlock = resolveCheckoutBlockState({
    overview,
    invoices: filterCustomerFacingInvoices(invoices),
    ignoredStripeInvoiceIds,
  });

  return {
    overview,
    usage,
    limits: usage.metrics.filter((metric) => metric.limit !== null),
    invoices: filterCustomerFacingInvoices(invoices),
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

    const rawStatus = subscription?.status ?? null;
    const billingProvider = subscription?.billing_provider ?? "stripe";
    const stripePriceId = subscription?.stripe_price_id ?? null;
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
      (isSubscriptionUsable(rawStatus) ||
        isPaymentProblem(rawStatus) ||
        isPaymentPending(rawStatus));
    const mappedPlan =
      showPlanFromSubscription && resolvedPlanKey ? safeGetPlanByKey(resolvedPlanKey) : null;
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
    let ignoredStripeInvoiceIds = new Set<string>();

    try {
      ignoredStripeInvoiceIds = await listIgnoredStripeInvoiceIds(session.organization.id);
    } catch {
      ignoredStripeInvoiceIds = new Set();
    }

    try {
      invoices = filterCustomerFacingInvoices(await listCustomerInvoices(session));
    } catch (error) {
      console.warn("[plans] Failed to load invoices for pricing page", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const checkoutBlock = resolveCheckoutBlockState({
      overview,
      invoices,
      ignoredStripeInvoiceIds,
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
      checkoutBlock,
      ignoredStripeInvoiceIds,
    };
  } catch (error) {
    console.error("[plans] getPlansPageBillingState failed — returning fallback billing state", {
      organizationId: session.organization.id,
      message: error instanceof Error ? error.message : String(error),
    });

    const fallbackOverview = buildBillingOverview(null, "starter", null, null);
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
      }),
      ignoredStripeInvoiceIds: new Set<string>(),
    };
  }
}

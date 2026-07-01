import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import { getPlanKeyByPriceId, getPlanPriceId } from "@/lib/billing/plans.server";
import { getOrganizationIdByStripeCustomerId } from "@/lib/stripe/customers";
import { getStripeClient } from "@/lib/stripe/client";
import {
  syncOrganizationPlan,
  upsertOrganizationSubscription,
} from "@/lib/stripe/subscriptions";
import {
  mapStripeSubscription,
  resolveOrganizationIdFromMetadata,
  resolvePlanKeyFromMetadata,
} from "@/lib/stripe/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

const CHECKOUT_SESSION_EXPAND: Stripe.Checkout.SessionRetrieveParams["expand"] = [
  "subscription",
  "subscription.items.data.price",
  "line_items",
];

const RECENT_CHECKOUT_WINDOW_MS = 24 * 60 * 60 * 1000;

type CheckoutSyncLog = {
  checkoutSessionId: string | null;
  subscriptionId: string | null;
  priceId: string | null;
  resolvedPlan: PlanKey | null;
  organizationId: string | null;
  source: "session_id" | "recent_lookup" | "webhook";
};

function logCheckoutSync(details: CheckoutSyncLog): void {
  console.info("[stripe] checkout sync", {
    checkoutSessionId: details.checkoutSessionId,
    subscriptionId: details.subscriptionId,
    priceId: details.priceId,
    resolvedPlan: details.resolvedPlan,
    organizationId: details.organizationId,
    source: details.source,
  });
}

async function resolveOrganizationId(
  organizationId: string | null,
  stripeCustomerId: string | null,
): Promise<string | null> {
  if (organizationId) {
    return organizationId;
  }

  if (stripeCustomerId) {
    return getOrganizationIdByStripeCustomerId(stripeCustomerId);
  }

  return null;
}

function extractSubscriptionId(session: Stripe.Checkout.Session): string | null {
  if (typeof session.subscription === "string") {
    return session.subscription;
  }

  if (session.subscription && typeof session.subscription === "object") {
    return session.subscription.id;
  }

  return null;
}

function extractExpandedSubscription(
  session: Stripe.Checkout.Session,
): Stripe.Subscription | null {
  if (session.subscription && typeof session.subscription === "object") {
    return session.subscription;
  }

  return null;
}

function extractCustomerId(session: Stripe.Checkout.Session): string | null {
  if (typeof session.customer === "string") {
    return session.customer;
  }

  if (session.customer && typeof session.customer === "object") {
    return session.customer.id;
  }

  return null;
}

function extractPriceIdFromLineItems(session: Stripe.Checkout.Session): string | null {
  const lineItems = session.line_items?.data ?? [];

  for (const item of lineItems) {
    const priceId = item.price?.id;
    if (priceId) {
      return priceId;
    }
  }

  return null;
}

function resolvePriceIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
  planKey: PlanKey | null,
): string | null {
  const metadataPriceId = metadata?.price_id?.trim();
  if (metadataPriceId) {
    return metadataPriceId;
  }

  if (!planKey) {
    return null;
  }

  try {
    return getPlanPriceId(planKey);
  } catch {
    return null;
  }
}

function resolvePlanFromPriceId(
  priceId: string | null,
  metadataPlanKey: PlanKey | null,
): PlanKey | null {
  if (priceId) {
    const mapped = getPlanKeyByPriceId(priceId);
    if (mapped) {
      return mapped;
    }
  }

  return metadataPlanKey;
}

function isCheckoutSessionReady(session: Stripe.Checkout.Session): boolean {
  if (session.status === "complete") {
    return true;
  }

  return session.payment_status === "paid" || session.payment_status === "no_payment_required";
}

async function retrieveSubscription(
  subscriptionId: string,
  expanded: Stripe.Subscription | null,
): Promise<Stripe.Subscription> {
  if (expanded?.id === subscriptionId) {
    return expanded;
  }

  const stripe = getStripeClient();
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
}

async function getStripeCustomerIdForOrganization(organizationId: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("organization_subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    console.error("[stripe] checkout sync customer lookup failed:", error.message);
    return null;
  }

  return (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id ?? null;
}

/** Find the most recent completed Checkout session for an organization. */
export async function findRecentCompletedCheckoutSessionId(
  organizationId: string,
): Promise<string | null> {
  const customerId = await getStripeCustomerIdForOrganization(organizationId);

  if (!customerId) {
    return null;
  }

  const stripe = getStripeClient();
  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 10,
  });

  const cutoff = Date.now() - RECENT_CHECKOUT_WINDOW_MS;

  for (const session of sessions.data) {
    if (session.created * 1000 < cutoff) {
      continue;
    }

    if (!isCheckoutSessionReady(session)) {
      continue;
    }

    const sessionOrganizationId =
      resolveOrganizationIdFromMetadata(session.metadata) ?? session.client_reference_id;

    if (sessionOrganizationId && sessionOrganizationId !== organizationId) {
      continue;
    }

    return session.id;
  }

  return null;
}

/** Apply a completed Checkout session to organization_subscriptions. */
export async function applyCheckoutSessionToOrganization(
  session: Stripe.Checkout.Session,
  source: CheckoutSyncLog["source"] = "webhook",
): Promise<string | null> {
  const customerId = extractCustomerId(session);
  const organizationId = await resolveOrganizationId(
    resolveOrganizationIdFromMetadata(session.metadata) ?? session.client_reference_id,
    customerId,
  );

  if (!organizationId) {
    console.error("[stripe] checkout session missing organization_id", {
      checkoutSessionId: session.id,
    });
    return null;
  }

  const planKey = resolvePlanKeyFromMetadata(session.metadata);
  const metadataPriceId =
    resolvePriceIdFromMetadata(session.metadata, planKey) ??
    extractPriceIdFromLineItems(session);
  const subscriptionId = extractSubscriptionId(session);

  if (customerId && !subscriptionId) {
    await upsertOrganizationSubscription({
      organizationId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
      stripePriceId: metadataPriceId,
      status: "incomplete",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
    });

    logCheckoutSync({
      checkoutSessionId: session.id,
      subscriptionId: null,
      priceId: metadataPriceId,
      resolvedPlan: planKey,
      organizationId,
      source,
    });

    return organizationId;
  }

  if (!subscriptionId) {
    console.error("[stripe] checkout session missing subscription id", {
      checkoutSessionId: session.id,
      organizationId,
    });
    return organizationId;
  }

  let subscription = extractExpandedSubscription(session);

  if (!subscription) {
    subscription = await retrieveSubscription(subscriptionId, null);
  }

  const syncInput = mapStripeSubscription(organizationId, subscription);

  if (customerId) {
    syncInput.stripeCustomerId = customerId;
  }

  const resolvedPriceId =
    syncInput.stripePriceId ?? metadataPriceId ?? extractPriceIdFromLineItems(session);

  if (resolvedPriceId) {
    syncInput.stripePriceId = resolvedPriceId;
  }

  await upsertOrganizationSubscription(syncInput);
  await syncOrganizationPlan(organizationId, subscription.status);

  logCheckoutSync({
    checkoutSessionId: session.id,
    subscriptionId,
    priceId: syncInput.stripePriceId,
    resolvedPlan: resolvePlanFromPriceId(syncInput.stripePriceId, planKey),
    organizationId,
    source,
  });

  return organizationId;
}

export type CheckoutSessionSyncResult = {
  synced: boolean;
  planActivated: boolean;
  planLabel: string | null;
  message: string;
};

async function retrieveCheckoutSession(checkoutSessionId: string): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: CHECKOUT_SESSION_EXPAND,
  });
}

/** Fallback sync when returning from Stripe Checkout before webhook delivery. */
export async function syncCheckoutSessionForOrganization(
  organizationId: string,
  checkoutSessionId?: string | null,
): Promise<CheckoutSessionSyncResult> {
  try {
    const resolvedSessionId =
      checkoutSessionId?.trim() ||
      (await findRecentCompletedCheckoutSessionId(organizationId));

    if (!resolvedSessionId) {
      console.warn("[stripe] checkout sync skipped — no session id", { organizationId });
      return {
        synced: false,
        planActivated: false,
        planLabel: null,
        message: "Payment received. Your plan may update shortly.",
      };
    }

    const session = await retrieveCheckoutSession(resolvedSessionId);
    const sessionOrganizationId =
      resolveOrganizationIdFromMetadata(session.metadata) ?? session.client_reference_id;

    if (sessionOrganizationId && sessionOrganizationId !== organizationId) {
      console.warn("[stripe] checkout session organization mismatch", {
        checkoutSessionId: resolvedSessionId,
        organizationId,
      });
      return {
        synced: false,
        planActivated: false,
        planLabel: null,
        message: "Payment received. Your plan may update shortly.",
      };
    }

    if (!isCheckoutSessionReady(session)) {
      console.warn("[stripe] checkout session not ready for sync", {
        checkoutSessionId: resolvedSessionId,
        status: session.status,
        paymentStatus: session.payment_status,
      });
      return {
        synced: false,
        planActivated: false,
        planLabel: null,
        message: "Payment received. Your plan may update shortly.",
      };
    }

    const appliedOrganizationId = await applyCheckoutSessionToOrganization(
      session,
      checkoutSessionId?.trim() ? "session_id" : "recent_lookup",
    );

    if (!appliedOrganizationId) {
      return {
        synced: false,
        planActivated: false,
        planLabel: null,
        message: "Payment received. Your plan may update shortly.",
      };
    }

    const { getOrganizationPlanContext } = await import("@/lib/plans/queries");
    const planContext = await getOrganizationPlanContext(organizationId);

    if (planContext.isActiveSubscription && planContext.planSource === "active_subscription") {
      return {
        synced: true,
        planActivated: true,
        planLabel: planContext.planLabel,
        message: `Payment received. Your ${planContext.planLabel} plan is now active.`,
      };
    }

    if (planContext.planSource === "unmapped_price_id") {
      console.error("[stripe] checkout synced but price id is unmapped", {
        checkoutSessionId: resolvedSessionId,
        priceId: planContext.subscriptionPriceId,
        organizationId,
      });
    }

    return {
      synced: true,
      planActivated: false,
      planLabel: planContext.planLabel,
      message: "Payment received. Your plan may update shortly.",
    };
  } catch (error) {
    console.error(
      "[stripe] checkout session sync failed:",
      error instanceof Error ? error.message : error,
    );
    return {
      synced: false,
      planActivated: false,
      planLabel: null,
      message: "Payment received. Your plan may update shortly.",
    };
  }
}

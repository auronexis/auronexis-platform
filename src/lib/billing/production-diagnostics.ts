import "server-only";

import {
  collectCleanupRecommendations,
  countCleanupRecommendationSeverity,
  type CleanupRecommendation,
} from "@/lib/billing/cleanup-recommendations";
import {
  classifyInvoiceRow,
  collectBillingSanityWarnings,
  collectSubscriptionHygieneFlags,
  getInvoiceHygieneLabel,
  mapBillingEventDiagnostic,
  mapWebhookEventDiagnostic,
  type BillingEventDiagnosticView,
  type BillingHygieneFlag,
  type BillingWebhookEventDiagnosticView,
} from "@/lib/billing/hygiene";
import {
  resolveBillingProductionHealth,
  resolveCheckoutBlockState,
  type BillingProductionHealth,
  type CheckoutBlockState,
} from "@/lib/billing/checkout-block";
import {
  hasVerifiedFastSpringSubscription,
  hasVerifiedPaddleCustomer,
  hasVerifiedPaddleSubscription,
  isStaleStripeAbandonedCheckout,
  providerSubscriptionBlocksCheckout,
} from "@/lib/billing/active-billing";
import { listIgnoredStripeInvoiceIds } from "@/lib/billing/invoices";
import { getBillingOverview } from "@/lib/billing/queries";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import type { BillingProvider } from "@/lib/billing/provider-types";
import type { CustomerInvoiceView } from "@/lib/billing/types";
import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import {
  safeGetPlanKeyByStripePriceId,
  safeGetPlanKeyFromSubscriptionPrice,
} from "@/lib/billing/plans.server";
import { listCustomerInvoices } from "@/lib/billing/invoices";
import { listAllOrganizationSubscriptions } from "@/lib/billing/maintenance";
import { isDevForcePlanConfigured } from "@/lib/plans/dev-override";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";
import type { BillingEvent, OrganizationSubscription, StripeWebhookEvent } from "@/types/database";

const LIST_LIMIT = 10;

export type BillingInvoiceDiagnosticView = CustomerInvoiceView & {
  rowKind: ReturnType<typeof classifyInvoiceRow>;
  hygieneLabel: string;
};

/**
 * Historical-archive-only view. FastSpring is the active billing provider —
 * `paddle_webhook_events` rows are legacy Paddle webhook deliveries retained
 * for audit and never drive current checkout, portal, or entitlement logic.
 */
export type PaddleWebhookDiagnosticView = {
  id: string;
  providerEventId: string;
  eventType: string;
  status: string;
  receivedAt: string;
  lastError: string | null;
};

export type BillingProductionDiagnostics = {
  organizationId: string;
  organizationName: string;
  activeProvider: BillingProvider;
  subscription: OrganizationSubscription | null;
  allSubscriptions: OrganizationSubscription[];
  resolvedPlanKey: PlanKey | null;
  resolvedPlanLabel: string | null;
  hasStripeCustomerId: boolean;
  hasStripeSubscriptionId: boolean;
  /** Active FastSpring subscription verification. */
  hasFastSpringSubscriptionId: boolean;
  fastspringCheckoutBlocked: boolean;
  fastspringCheckoutBlockReason: string | null;
  /** Legacy/historical Paddle fields — FastSpring is the active provider. */
  hasPaddleCustomerId: boolean;
  hasPaddleSubscriptionId: boolean;
  invoices: BillingInvoiceDiagnosticView[];
  webhookEvents: BillingWebhookEventDiagnosticView[];
  /** Historical-archive-only Paddle webhook rows — never drives active billing. */
  paddleWebhookEvents: PaddleWebhookDiagnosticView[];
  billingEvents: BillingEventDiagnosticView[];
  hygieneFlags: BillingHygieneFlag[];
  sanityWarnings: BillingHygieneFlag[];
  checkoutBlock: CheckoutBlockState;
  productionHealth: BillingProductionHealth;
  cleanupRecommendations: CleanupRecommendation[];
  ignoredStripeInvoiceIds: string[];
  staleStripeRemnantCount: number;
};

async function listBillingEventsForOrganization(
  organizationId: string,
  limit: number,
): Promise<BillingEvent[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("billing_events")
    .select("id, organization_id, event_type, stripe_event_id, payload, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[billing][diagnostics] billing_events query failed:", error.message);
    return [];
  }

  return (data ?? []) as BillingEvent[];
}

async function listStripeWebhookEventsForOrganization(
  organizationId: string,
  relatedStripeEventIds: string[],
  limit: number,
): Promise<StripeWebhookEvent[]> {
  const admin = createAdminClient();
  const byOrg = await admin
    .from("stripe_webhook_events")
    .select(
      "id, stripe_event_id, event_type, status, organization_id, retry_count, error_message, received_at, processed_at, last_attempt_at",
    )
    .eq("organization_id", organizationId)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (byOrg.error) {
    console.error("[billing][diagnostics] stripe_webhook_events query failed:", byOrg.error.message);
    return [];
  }

  const rows = new Map<string, StripeWebhookEvent>();
  for (const row of (byOrg.data ?? []) as StripeWebhookEvent[]) {
    rows.set(row.stripe_event_id, row);
  }

  const missingIds = relatedStripeEventIds.filter((id) => !rows.has(id)).slice(0, limit);

  if (missingIds.length > 0) {
    const byEventId = await admin
      .from("stripe_webhook_events")
      .select(
        "id, stripe_event_id, event_type, status, organization_id, retry_count, error_message, received_at, processed_at, last_attempt_at",
      )
      .in("stripe_event_id", missingIds);

    if (!byEventId.error) {
      for (const row of (byEventId.data ?? []) as StripeWebhookEvent[]) {
        rows.set(row.stripe_event_id, row);
      }
    }
  }

  return Array.from(rows.values())
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
    .slice(0, limit);
}

/** Historical-archive-only — Paddle is not the active billing provider. */
async function listPaddleWebhookEventsForOrganization(
  organizationId: string,
  limit: number,
): Promise<PaddleWebhookDiagnosticView[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("paddle_webhook_events")
    .select("id, provider_event_id, event_type, status, received_at, last_error")
    .eq("organization_id", organizationId)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[billing][diagnostics] paddle_webhook_events query failed:", error.message);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    provider_event_id: string;
    event_type: string;
    status: string;
    received_at: string;
    last_error: string | null;
  }>).map((row) => ({
    id: row.id,
    providerEventId: row.provider_event_id,
    eventType: row.event_type,
    status: row.status,
    receivedAt: row.received_at,
    lastError: row.last_error,
  }));
}

function mapInvoiceDiagnostics(invoices: CustomerInvoiceView[]): BillingInvoiceDiagnosticView[] {
  return invoices.map((invoice) => ({
    ...invoice,
    rowKind: classifyInvoiceRow(invoice),
    hygieneLabel: getInvoiceHygieneLabel(invoice),
  }));
}

/** Owner/admin billing production diagnostics — no secrets, no automatic deletes. */
export async function getBillingProductionDiagnostics(
  session: SessionContext,
): Promise<BillingProductionDiagnostics> {
  const organizationId = session.organization.id;
  const activeProvider = getActiveBillingProvider();

  const [overview, invoices, billingEventRows, allSubscriptions, ignoredSet, paddleWebhookEvents] =
    await Promise.all([
      getBillingOverview(session),
      listCustomerInvoices(session, LIST_LIMIT),
      listBillingEventsForOrganization(organizationId, LIST_LIMIT),
      listAllOrganizationSubscriptions(organizationId),
      listIgnoredStripeInvoiceIds(organizationId),
      listPaddleWebhookEventsForOrganization(organizationId, LIST_LIMIT),
    ]);

  const subscription = overview.subscription;
  const resolvedPlanKey =
    activeProvider === "fastspring"
      ? safeGetPlanKeyFromSubscriptionPrice({
          billingProvider: subscription?.billing_provider ?? "fastspring",
          stripePriceId: null,
          providerPriceId: subscription?.provider_price_id,
        }) ?? overview.currentPlanKey
      : activeProvider === "paddle"
        ? safeGetPlanKeyFromSubscriptionPrice({
            billingProvider: "paddle",
            stripePriceId: null,
            providerPriceId: subscription?.provider_price_id,
          })
        : subscription?.stripe_price_id
          ? safeGetPlanKeyByStripePriceId(subscription.stripe_price_id)
          : overview.currentPlanKey;
  const resolvedPlanLabel = resolvedPlanKey
    ? (safeGetPlanByKey(resolvedPlanKey)?.name ?? null)
    : null;

  const relatedStripeEventIds = billingEventRows
    .map((event) => event.stripe_event_id)
    .filter((value): value is string => Boolean(value));

  const webhookRows = await listStripeWebhookEventsForOrganization(
    organizationId,
    relatedStripeEventIds,
    LIST_LIMIT,
  );

  const invoiceDiagnostics = mapInvoiceDiagnostics(invoices);
  const webhookEvents = webhookRows.map(mapWebhookEventDiagnostic);
  const billingEvents = billingEventRows.map(mapBillingEventDiagnostic);

  const devPlanOverride = isDevForcePlanConfigured();
  const hygieneFlags = collectSubscriptionHygieneFlags(subscription, {
    mappedPlanKey: resolvedPlanKey,
    devPlanOverride,
  });

  const sanityWarnings = collectBillingSanityWarnings({
    subscription,
    invoices,
    webhookEvents: webhookRows,
  });

  const checkoutBlock = resolveCheckoutBlockState({
    overview,
    invoices,
    ignoredStripeInvoiceIds: ignoredSet,
    activeProvider,
  });

  const cleanupRecommendations = collectCleanupRecommendations({
    subscription,
    allSubscriptions,
    invoices,
    billingEvents: billingEventRows,
    checkoutBlock,
    mappedPlanKey: resolvedPlanKey,
    devPlanOverride,
  });

  const severityCounts = countCleanupRecommendationSeverity(cleanupRecommendations);
  const productionHealth = resolveBillingProductionHealth({
    checkoutBlock,
    recommendationCount: severityCounts.total,
    dangerRecommendationCount: severityCounts.danger,
  });

  const fastspringCheckoutBlocked =
    checkoutBlock.blocked || providerSubscriptionBlocksCheckout(subscription);
  const fastspringCheckoutBlockReason = checkoutBlock.blocked
    ? (checkoutBlock.message ?? checkoutBlock.bannerMessage)
    : providerSubscriptionBlocksCheckout(subscription)
      ? "Verified FastSpring subscription state blocks checkout."
      : null;

  return {
    organizationId,
    organizationName: session.organization.name,
    activeProvider,
    subscription,
    allSubscriptions,
    resolvedPlanKey,
    resolvedPlanLabel,
    hasStripeCustomerId: Boolean(subscription?.stripe_customer_id),
    hasStripeSubscriptionId: Boolean(subscription?.stripe_subscription_id),
    hasFastSpringSubscriptionId: hasVerifiedFastSpringSubscription(subscription),
    fastspringCheckoutBlocked,
    fastspringCheckoutBlockReason,
    hasPaddleCustomerId: hasVerifiedPaddleCustomer(subscription),
    hasPaddleSubscriptionId: hasVerifiedPaddleSubscription(subscription),
    invoices: invoiceDiagnostics,
    webhookEvents,
    paddleWebhookEvents,
    billingEvents,
    hygieneFlags,
    sanityWarnings,
    checkoutBlock,
    productionHealth,
    cleanupRecommendations,
    ignoredStripeInvoiceIds: Array.from(ignoredSet),
    staleStripeRemnantCount: allSubscriptions.filter((row) => isStaleStripeAbandonedCheckout(row))
      .length,
  };
}

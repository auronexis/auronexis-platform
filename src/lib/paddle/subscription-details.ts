import "server-only";

import { getPaddleClient } from "@/lib/paddle/client";
import { parsePaddleMoneyToCents } from "@/lib/paddle/money";
import { getOrganizationSubscription } from "@/lib/billing/queries";
import {
  hasVerifiedPaddleCustomer,
  hasVerifiedPaddleSubscription,
} from "@/lib/billing/active-billing";
import { getBillingStatusLabel, getPaymentSummaryLabel } from "@/lib/billing/status";
import { safeGetPlanByKey } from "@/lib/billing/plans";
import { safeGetPlanKeyFromSubscriptionPrice } from "@/lib/billing/plans.server";
import type { SessionContext } from "@/lib/tenancy/context";

export type PaddleNextPayment = {
  date: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  currency: string | null;
};

export type PaddlePaymentMethodSummary = {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
};

export type PaddleBillingDetails = {
  planLabel: string;
  status: string;
  paymentStatus: string;
  periodStart: string | null;
  periodEnd: string | null;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  nextPayment: PaddleNextPayment | null;
  paymentMethod: PaddlePaymentMethodSummary | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return null;
}

/**
 * Best-effort next-payment breakdown from a live Paddle subscription lookup.
 * Returns null when Paddle has no upcoming transaction data — never invents one.
 */
function extractNextPayment(live: Record<string, unknown>): PaddleNextPayment | null {
  const nextTransaction = asRecord(live.nextTransaction ?? live.next_transaction);
  const details = asRecord(nextTransaction.details);
  const totals = asRecord(details.totals);
  const date = asString(live.nextBilledAt ?? live.next_billed_at);

  if (!date && Object.keys(totals).length === 0) {
    return null;
  }

  return {
    date,
    subtotal: parsePaddleMoneyToCents(totals.subtotal),
    tax: parsePaddleMoneyToCents(totals.tax),
    total: parsePaddleMoneyToCents(totals.total ?? totals.grandTotal ?? totals.grand_total),
    currency: asString(totals.currencyCode ?? totals.currency_code),
  };
}

/** Best-effort saved-card summary. Never returns full card numbers. */
function extractPaymentMethod(methods: unknown): PaddlePaymentMethodSummary | null {
  const list = Array.isArray(methods) ? methods : [];
  const first = asRecord(list[0]);
  const card = asRecord(first.card);

  if (Object.keys(card).length === 0) {
    return null;
  }

  return {
    brand: asString(card.type),
    last4: asString(card.last4),
    expMonth: asNumber(card.expiryMonth ?? card.expiry_month),
    expYear: asNumber(card.expiryYear ?? card.expiry_year),
  };
}

/**
 * Customer-facing Paddle billing summary for the current organization.
 * Starts from the locally persisted subscription row, then enriches with a
 * live Paddle lookup only when a verified Paddle subscription/customer id
 * exists. Missing live data (next payment, payment method) is returned as
 * null rather than guessed.
 */
export async function getPaddleBillingDetails(
  session: SessionContext,
): Promise<PaddleBillingDetails> {
  const subscription = await getOrganizationSubscription(session);

  const planKey = safeGetPlanKeyFromSubscriptionPrice({
    billingProvider: subscription?.billing_provider,
    providerPriceId: subscription?.provider_price_id,
  });
  const plan = planKey ? safeGetPlanByKey(planKey) : null;
  const rawStatus = subscription?.provider_status ?? subscription?.status ?? null;

  const details: PaddleBillingDetails = {
    planLabel: plan?.name ?? "No active subscription",
    status: getBillingStatusLabel(rawStatus),
    paymentStatus: getPaymentSummaryLabel(rawStatus),
    periodStart: subscription?.current_period_start ?? null,
    periodEnd: subscription?.current_period_end ?? null,
    renewalDate: subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    nextPayment: null,
    paymentMethod: null,
  };

  const subscriptionId = subscription?.provider_subscription_id?.trim() ?? "";
  if (hasVerifiedPaddleSubscription(subscription) && subscriptionId) {
    const paddle = getPaddleClient();
    try {
      const live = asRecord(
        await paddle.subscriptions.get(subscriptionId, {
          include: ["next_transaction"],
        } as never),
      );

      const currentBilling = asRecord(live.currentBillingPeriod ?? live.current_billing_period);
      const liveStatus = asString(live.status);

      details.periodStart = asString(currentBilling.startsAt ?? currentBilling.starts_at) ?? details.periodStart;
      details.periodEnd = asString(currentBilling.endsAt ?? currentBilling.ends_at) ?? details.periodEnd;
      details.renewalDate = details.periodEnd;
      details.cancelAtPeriodEnd = Boolean(
        live.scheduledChange ?? live.scheduled_change ?? details.cancelAtPeriodEnd,
      );
      if (liveStatus) {
        details.status = getBillingStatusLabel(liveStatus);
        details.paymentStatus = getPaymentSummaryLabel(liveStatus);
      }
      details.nextPayment = extractNextPayment(live);
    } catch (error) {
      console.warn("[paddle] live subscription lookup failed — using persisted state only", {
        organizationId: session.organization.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const customerId = subscription?.provider_customer_id?.trim() ?? "";
  if (hasVerifiedPaddleCustomer(subscription) && customerId) {
    const paddle = getPaddleClient();
    try {
      const collection = paddle.paymentMethods.list(customerId);
      const firstPage = await collection.next();
      details.paymentMethod = extractPaymentMethod(firstPage);
    } catch (error) {
      console.warn("[paddle] payment method lookup failed", {
        organizationId: session.organization.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return details;
}

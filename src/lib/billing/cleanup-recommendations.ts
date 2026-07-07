import {
  classifyInvoiceRow,
  classifySubscriptionRow,
  type BillingHygieneFlag,
} from "@/lib/billing/hygiene";
import type { CheckoutBlockState } from "@/lib/billing/checkout-block";
import {
  getBillingStatusLabel,
  isSubscriptionInactive,
  normalizeSubscriptionStatus,
} from "@/lib/billing/status";
import type { CustomerInvoiceView } from "@/lib/billing/types";
import type { PlanKey } from "@/lib/billing/plans";
import type { BillingEvent, OrganizationSubscription } from "@/types/database";

export type CleanupRecommendationSeverity = "info" | "warning" | "danger";

export type CleanupRecommendation = {
  code: string;
  severity: CleanupRecommendationSeverity;
  title: string;
  message: string;
  entityType: "subscription" | "invoice" | "checkout" | "organization";
  entityId?: string;
  stripeId?: string;
  actionable: boolean;
  suggestedAction?: string;
};

export function collectCleanupRecommendations(input: {
  subscription: OrganizationSubscription | null;
  allSubscriptions: OrganizationSubscription[];
  invoices: CustomerInvoiceView[];
  billingEvents: BillingEvent[];
  checkoutBlock: CheckoutBlockState;
  mappedPlanKey?: PlanKey | null;
  devPlanOverride?: boolean;
}): CleanupRecommendation[] {
  const recommendations: CleanupRecommendation[] = [];
  const subscription = input.subscription;
  const status = normalizeSubscriptionStatus(subscription?.status);
  const subscriptionCanceled = isSubscriptionInactive(status);

  for (const invoice of input.invoices) {
    if (invoice.status === "open" && invoice.amountPaid === 0) {
      recommendations.push({
        code: "open_unpaid_invoice",
        severity: input.checkoutBlock.blocked ? "warning" : "info",
        title: "Open unpaid invoice",
        message: `Invoice ${invoice.stripeInvoiceId} is open with ${invoice.formattedAmount} due. This can block new checkout.`,
        entityType: "invoice",
        entityId: invoice.id,
        stripeId: invoice.stripeInvoiceId,
        actionable: true,
        suggestedAction: "Re-sync invoices from Stripe or mark as ignored if diagnostic-only.",
      });
    }
  }

  if (subscriptionCanceled) {
    for (const invoice of input.invoices) {
      if (invoice.status === "open") {
        recommendations.push({
          code: "canceled_subscription_open_invoice",
          severity: "warning",
          title: "Canceled subscription with open invoice",
          message: `Subscription is ${getBillingStatusLabel(status).toLowerCase()} but invoice ${invoice.stripeInvoiceId} remains open locally.`,
          entityType: "invoice",
          entityId: invoice.id,
          stripeId: invoice.stripeInvoiceId,
          actionable: true,
          suggestedAction: "Re-sync from Stripe, then clear stale local rows if Stripe shows void/uncollectible.",
        });
      }
    }
  }

  const stripeInvoiceCounts = new Map<string, number>();
  for (const invoice of input.invoices) {
    stripeInvoiceCounts.set(
      invoice.stripeInvoiceId,
      (stripeInvoiceCounts.get(invoice.stripeInvoiceId) ?? 0) + 1,
    );
  }

  for (const [stripeInvoiceId, count] of stripeInvoiceCounts) {
    if (count > 1) {
      recommendations.push({
        code: "duplicate_invoice_rows",
        severity: "danger",
        title: "Duplicate invoice rows",
        message: `${count} local rows reference Stripe invoice ${stripeInvoiceId}.`,
        entityType: "invoice",
        stripeId: stripeInvoiceId,
        actionable: true,
        suggestedAction: "Re-sync invoices from Stripe to reconcile duplicates.",
      });
    }
  }

  const openUnpaidCount = input.invoices.filter(
    (invoice) => invoice.status === "open" && invoice.amountPaid === 0,
  ).length;

  if (openUnpaidCount > 1) {
    recommendations.push({
      code: "duplicate_checkout_attempts",
      severity: "warning",
      title: "Multiple open checkout invoices",
      message: `${openUnpaidCount} open unpaid invoices exist — likely duplicate checkout attempts or stale test remnants.`,
      entityType: "checkout",
      actionable: true,
      suggestedAction: "Re-sync invoices, then clear stale rows confirmed void/uncollectible in Stripe.",
    });
  }

  for (const row of input.allSubscriptions) {
    const kind = classifySubscriptionRow(row, {
      mappedPlanKey: input.mappedPlanKey,
      devPlanOverride: input.devPlanOverride,
    });

    if (kind === "internal") {
      recommendations.push({
        code: "inactive_row_without_stripe_ids",
        severity: "info",
        title: "Inactive row without Stripe IDs",
        message: "A subscription row has no stripe_customer_id or stripe_subscription_id.",
        entityType: "subscription",
        entityId: row.id,
        actionable: false,
        suggestedAction: "Review only — do not delete active production identifiers.",
      });
    }
  }

  if (input.allSubscriptions.length > 1) {
    recommendations.push({
      code: "multiple_subscription_rows",
      severity: "danger",
      title: "Multiple subscription rows",
      message: `${input.allSubscriptions.length} organization_subscriptions rows exist for this workspace. Preferred active/trialing row is used for billing UI.`,
      entityType: "organization",
      actionable: true,
      suggestedAction: "Re-sync current subscription from Stripe. Do not delete rows without Stripe confirmation.",
    });
  }

  const staleCheckoutEvents = input.billingEvents.filter((event) => {
    const type = event.event_type.toLowerCase();
    return (
      type.includes("checkout") ||
      type.includes("session") ||
      type.includes("incomplete")
    );
  });

  if (staleCheckoutEvents.length > 0) {
    recommendations.push({
      code: "stale_checkout_artifacts",
      severity: "info",
      title: "Stale checkout/session artifacts",
      message: `${staleCheckoutEvents.length} recent billing audit events reference checkout or incomplete sessions.`,
      entityType: "checkout",
      actionable: true,
      suggestedAction: "Refresh billing from Stripe to align subscription and invoice state.",
    });
  }

  if (subscription) {
    const kind = classifySubscriptionRow(subscription, {
      mappedPlanKey: input.mappedPlanKey,
      devPlanOverride: input.devPlanOverride,
    });

    if (kind === "stale") {
      recommendations.push({
        code: "stale_subscription_row",
        severity: "info",
        title: "Stale subscription row",
        message:
          "Preferred subscription row appears inactive/canceled with no Stripe subscription id for 90+ days.",
        entityType: "subscription",
        entityId: subscription.id,
        actionable: true,
        suggestedAction: "Re-sync current subscription from Stripe if customer still has active billing.",
      });
    }
  }

  for (const invoice of input.invoices) {
    if (classifyInvoiceRow(invoice) === "stale") {
      recommendations.push({
        code: "stale_invoice_row",
        severity: "info",
        title: "Stale invoice row",
        message: `Invoice ${invoice.stripeInvoiceId} is ${invoice.statusLabel.toLowerCase()} locally and can be cleared after Stripe confirmation.`,
        entityType: "invoice",
        entityId: invoice.id,
        stripeId: invoice.stripeInvoiceId,
        actionable: true,
        suggestedAction: "Clear stale local invoice rows (Stripe void/uncollectible only).",
      });
    }
  }

  return dedupeRecommendations(recommendations);
}

function dedupeRecommendations(recommendations: CleanupRecommendation[]): CleanupRecommendation[] {
  const seen = new Set<string>();
  const result: CleanupRecommendation[] = [];

  for (const item of recommendations) {
    const key = `${item.code}:${item.entityId ?? item.stripeId ?? "global"}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

export function countCleanupRecommendationSeverity(
  recommendations: CleanupRecommendation[],
): { total: number; danger: number; warning: number } {
  return {
    total: recommendations.length,
    danger: recommendations.filter((item) => item.severity === "danger").length,
    warning: recommendations.filter((item) => item.severity === "warning").length,
  };
}

export function cleanupRecommendationToHygieneFlag(
  recommendation: CleanupRecommendation,
): BillingHygieneFlag {
  return {
    code: recommendation.code,
    severity: recommendation.severity,
    message: recommendation.message,
    entityType:
      recommendation.entityType === "checkout"
        ? "billing_event"
        : recommendation.entityType === "organization"
          ? "organization"
          : recommendation.entityType,
    entityId: recommendation.entityId,
  };
}

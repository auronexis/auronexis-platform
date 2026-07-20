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
  /** Provider id (Paddle or archived Stripe) for diagnostics display. */
  providerId?: string;
  /** @deprecated Use providerId — kept for existing diagnostics consumers. */
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
        title: "Open unpaid invoice (archive)",
        message: `Archived invoice ${invoice.stripeInvoiceId} is open with ${invoice.formattedAmount} due. Active billing uses Paddle transactions.`,
        entityType: "invoice",
        entityId: invoice.id,
        providerId: invoice.stripeInvoiceId,
        stripeId: invoice.stripeInvoiceId,
        actionable: true,
        suggestedAction: "Confirm status in Paddle customer portal; treat Stripe rows as archive-only.",
      });
    }
  }

  if (subscriptionCanceled) {
    for (const invoice of input.invoices) {
      if (invoice.status === "open") {
        recommendations.push({
          code: "canceled_subscription_open_invoice",
          severity: "warning",
          title: "Canceled subscription with open archive invoice",
          message: `Subscription is ${getBillingStatusLabel(status).toLowerCase()} but archive invoice ${invoice.stripeInvoiceId} remains open locally.`,
          entityType: "invoice",
          entityId: invoice.id,
          providerId: invoice.stripeInvoiceId,
          stripeId: invoice.stripeInvoiceId,
          actionable: true,
          suggestedAction: "Reconcile from Paddle; clear stale archive rows only after confirmation.",
        });
      }
    }
  }

  const archiveInvoiceCounts = new Map<string, number>();
  for (const invoice of input.invoices) {
    archiveInvoiceCounts.set(
      invoice.stripeInvoiceId,
      (archiveInvoiceCounts.get(invoice.stripeInvoiceId) ?? 0) + 1,
    );
  }

  for (const [archiveInvoiceId, count] of archiveInvoiceCounts) {
    if (count > 1) {
      recommendations.push({
        code: "duplicate_invoice_rows",
        severity: "danger",
        title: "Duplicate archive invoice rows",
        message: `${count} local archive rows reference invoice ${archiveInvoiceId}.`,
        entityType: "invoice",
        providerId: archiveInvoiceId,
        stripeId: archiveInvoiceId,
        actionable: true,
        suggestedAction: "Deduplicate archive rows; live invoices come from Paddle transactions.",
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
      title: "Multiple open archive checkout invoices",
      message: `${openUnpaidCount} open unpaid archive invoices exist — likely stale test remnants.`,
      entityType: "checkout",
      actionable: true,
      suggestedAction: "Clear confirmed void/uncollectible archive rows; use Paddle for live billing state.",
    });
  }

  for (const row of input.allSubscriptions) {
    const kind = classifySubscriptionRow(row, {
      mappedPlanKey: input.mappedPlanKey,
      devPlanOverride: input.devPlanOverride,
    });

    if (kind === "internal") {
      recommendations.push({
        code: "inactive_row_without_provider_ids",
        severity: "info",
        title: "Inactive row without provider IDs",
        message: "A subscription row has no Paddle provider_customer_id / provider_subscription_id.",
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
      message: `${input.allSubscriptions.length} organization_subscriptions rows exist for this workspace. Preferred Paddle-backed row is used for billing UI.`,
      entityType: "organization",
      actionable: true,
      suggestedAction: "Reconcile from Paddle via webhook/sync. Do not delete rows without provider confirmation.",
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
      suggestedAction: "Confirm subscription state in Paddle customer portal and local sync_pending flags.",
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
          "Preferred subscription row appears inactive/canceled with no active Paddle subscription id for 90+ days.",
        entityType: "subscription",
        entityId: subscription.id,
        actionable: true,
        suggestedAction: "Reconcile from Paddle if the customer still has active billing.",
      });
    }
  }

  for (const invoice of input.invoices) {
    if (classifyInvoiceRow(invoice) === "stale") {
      recommendations.push({
        code: "stale_invoice_row",
        severity: "info",
        title: "Stale archive invoice row",
        message: `Archive invoice ${invoice.stripeInvoiceId} is ${invoice.statusLabel.toLowerCase()} locally and can be cleared after confirmation.`,
        entityType: "invoice",
        entityId: invoice.id,
        providerId: invoice.stripeInvoiceId,
        stripeId: invoice.stripeInvoiceId,
        actionable: true,
        suggestedAction: "Clear stale archive invoice rows only after provider confirmation.",
      });
    }
  }

  return dedupeRecommendations(recommendations);
}

function dedupeRecommendations(recommendations: CleanupRecommendation[]): CleanupRecommendation[] {
  const seen = new Set<string>();
  const result: CleanupRecommendation[] = [];

  for (const item of recommendations) {
    const key = `${item.code}:${item.entityId ?? item.providerId ?? item.stripeId ?? "global"}`;
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

import type { OrganizationSubscription } from "@/types/database";
import {
  isActiveBillingSubscriptionRow,
  resolveActiveBillingStatusFlags,
} from "@/lib/billing/active-billing";
import type { PlanKey } from "@/lib/billing/plans";
import type { CheckoutBlockState } from "@/lib/billing/checkout-block";
import type { BillingProvider } from "@/lib/billing/provider-types";
import {
  getBillingStatusLabel,
  getPaymentSummaryLabel,
  isActiveSubscriptionStatus,
  isSubscriptionInactive,
  isSubscriptionCanceled,
} from "@/lib/billing/status";
import type { BillingHistoryItem } from "@/lib/billing/history-types";
import type { PaddleBillingDetails } from "@/lib/paddle/subscription-details";
import { formatAppDateOrNull, formatAppDateTimeOrNull } from "@/lib/i18n";

export type UsageMetricKey =
  | "ai_generations"
  | "ai_tokens"
  | "api_requests"
  | "automation_executions"
  | "connector_syncs"
  | "workflow_executions"
  | "reports_generated"
  | "reports_published"
  | "storage_mb"
  | "active_users"
  | "active_clients"
  | "portal_users"
  | "email_sends";

export type UsageMetricSnapshot = {
  key: UsageMetricKey;
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  unit: string;
  percentUsed: number | null;
  atLimit: boolean;
  approachingLimit: boolean;
};

export type UsagePeriodSummary = {
  periodStart: string;
  periodEnd: string;
  metrics: UsageMetricSnapshot[];
};

export type UsageDashboardData = {
  current: UsagePeriodSummary;
  previous: UsagePeriodSummary;
  trends: Array<{
    key: UsageMetricKey;
    label: string;
    current: number;
    previous: number;
    changePercent: number | null;
    projectedEndOfMonth: number;
  }>;
  forecasts: UsageForecast[];
};

export type UsageForecast = {
  metric: UsageMetricKey;
  label: string;
  projectedUsage: number;
  limit: number | null;
  daysRemaining: number;
  likelyOverage: boolean;
  suggestedUpgrade: PlanKey | null;
};

export type BillingDashboardData = {
  overview: import("@/lib/billing/types").BillingOverview;
  usage: UsagePeriodSummary;
  limits: UsageMetricSnapshot[];
  /** @deprecated Legacy Stripe invoice mirror — always empty now. Use billingHistory. */
  invoices: CustomerInvoiceView[];
  /** Paddle transaction history — the sole active billing history source. */
  billingHistory: BillingHistoryItem[];
  /** Live Paddle subscription/payment details, when a verified Paddle subscription exists. */
  paddleDetails: PaddleBillingDetails | null;
  discounts: DiscountPreview[];
  prorationPreviews: ProrationPreview[];
  forecastStatus: "healthy" | "warning" | "critical";
  checkoutBlock: CheckoutBlockState;
};

export type CustomerInvoiceView = {
  id: string;
  stripeInvoiceId: string;
  status: string;
  statusLabel: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  formattedAmount: string;
  dueAt: string | null;
  paidAt: string | null;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  periodLabel: string | null;
  isFuture: boolean;
};

export type DiscountPreview = {
  code: string;
  description: string | null;
  discountType: "percentage" | "fixed";
  percentageOff: number | null;
  amountOff: number | null;
  formattedSavings: string;
  expiresAt: string | null;
  remainingRedemptions: number | null;
};

export type ValidatedDiscount = DiscountPreview & {
  valid: true;
  appliedToPlanKey: PlanKey;
  originalPriceCents: number;
  discountedPriceCents: number;
};

export type ProrationPreview = {
  fromPlanKey: PlanKey;
  toPlanKey: PlanKey;
  direction: "upgrade" | "downgrade" | "same";
  currentPlanPriceCents: number;
  targetPlanPriceCents: number;
  daysRemainingInPeriod: number;
  daysInPeriod: number;
  creditCents: number;
  chargeCents: number;
  netDueCents: number;
  formattedNetDue: string;
  effectiveAt: string;
};

export type BillingDiagnosticsSnapshot = {
  platformVersion: string;
  currentPlanKey: PlanKey;
  subscriptionState: string | null;
  /** @deprecated Field name kept for compat — now reflects Paddle configuration, not Stripe. */
  stripeConnected: boolean;
  usageMeteringEnabled: boolean;
  invoiceCount: number;
  webhookEventsLast7Days: number;
  upcomingRenewal: string | null;
  forecastStatus: "healthy" | "warning" | "critical";
  approachingLimits: number;
  reachedLimits: number;
};

export type BillingEventRecord = {
  organizationId: string;
  eventType: string;
  stripeEventId?: string | null;
  payload?: Record<string, unknown>;
};

export const BILLING_PLATFORM_VERSION = "billing-v2";

export const USAGE_METRIC_LABELS: Record<UsageMetricKey, string> = {
  ai_generations: "AI generations",
  ai_tokens: "AI tokens",
  api_requests: "API requests",
  automation_executions: "Automation executions",
  connector_syncs: "Connector syncs",
  workflow_executions: "Workflow executions",
  reports_generated: "Reports generated",
  reports_published: "Reports published",
  storage_mb: "Storage",
  active_users: "Active users",
  active_clients: "Active clients",
  portal_users: "Portal users",
  email_sends: "Email sends",
};

export type BillingOverview = {
  subscription: OrganizationSubscription | null;
  hasSubscription: boolean;
  /** Has an active billing relationship (active, trialing, or past_due). Not feature access. */
  isActive: boolean;
  /** Paid and healthy subscription (active or trialing only) — matches entitlements. */
  isUsable: boolean;
  hasPaymentProblem: boolean;
  isPaymentPending: boolean;
  isInactive: boolean;
  planLabel: string;
  currentPlanKey: PlanKey | null;
  statusLabel: string;
  paymentStatusLabel: string;
  renewalDate: string | null;
  billingPeriodLabel: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  /** Formatted end date when cancellation is scheduled at period end. */
  scheduledCancellationDate: string | null;
  isCanceled: boolean;
};

export function formatBillingDate(value: string | null | undefined): string | null {
  return formatAppDateOrNull(value);
}

export function formatBillingDateTime(value: string | null | undefined): string | null {
  return formatAppDateTimeOrNull(value);
}

export function buildBillingOverview(
  subscription: OrganizationSubscription | null,
  _organizationPlan: string,
  currentPlanName: string | null,
  currentPlanKey: PlanKey | null,
  activeProvider: BillingProvider = "paddle",
): BillingOverview {
  const flags = resolveActiveBillingStatusFlags(subscription, activeProvider);
  const displaySubscription =
    flags.rawStatus !== null || isActiveBillingSubscriptionRow(subscription, activeProvider)
      ? subscription
      : null;
  const rawStatus = flags.rawStatus ?? (displaySubscription ? displaySubscription.status : null);
  const isUsable = flags.isUsable;
  const hasPaymentProblem = flags.hasPaymentProblem;
  const paymentPending = flags.isPaymentPending;
  const isInactive = displaySubscription
    ? isSubscriptionInactive(rawStatus)
    : true;
  const isActive = isUsable || isActiveSubscriptionStatus(rawStatus);
  const isCanceled = isSubscriptionCanceled(rawStatus);

  const planLabel = isUsable
    ? (currentPlanName ?? "Subscription")
    : hasPaymentProblem || paymentPending
      ? (currentPlanName ?? "Subscription")
      : "No active subscription";

  const billingPeriodStart = formatBillingDate(displaySubscription?.current_period_start);
  const billingPeriodEnd = formatBillingDate(displaySubscription?.current_period_end);
  const billingPeriodLabel =
    billingPeriodStart && billingPeriodEnd
      ? `${billingPeriodStart} – ${billingPeriodEnd}`
      : null;

  return {
    subscription: displaySubscription,
    hasSubscription: flags.hasSubscription,
    isActive,
    isUsable,
    hasPaymentProblem,
    isPaymentPending: paymentPending,
    isInactive,
    planLabel,
    currentPlanKey: isUsable ? currentPlanKey : hasPaymentProblem || paymentPending ? currentPlanKey : null,
    statusLabel: getBillingStatusLabel(rawStatus),
    paymentStatusLabel: getPaymentSummaryLabel(rawStatus),
    renewalDate: billingPeriodEnd,
    billingPeriodLabel,
    trialEndsAt: displaySubscription?.trial_ends_at ?? null,
    cancelAtPeriodEnd: displaySubscription?.cancel_at_period_end ?? false,
    scheduledCancellationDate:
      displaySubscription?.cancel_at_period_end && billingPeriodEnd ? billingPeriodEnd : null,
    isCanceled,
  };
}

export function formatInvoiceDueLabel(invoice: CustomerInvoiceView): string {
  if (invoice.paidAt) {
    return `Paid ${formatBillingDateTime(invoice.paidAt) ?? ""}`.trim();
  }
  if (invoice.dueAt) {
    return `Due ${formatBillingDate(invoice.dueAt) ?? ""}`.trim();
  }
  return invoice.statusLabel;
}

/** Customer-safe billing capability flags — no environment variable names. */
export type BillingUiStatus = {
  checkoutAvailable: boolean;
  portalAvailable: boolean;
  /** Whether the active provider's customer portal allows self-serve cancellation. */
  portalCancellationAvailable: boolean;
  planCheckoutReady: Record<PlanKey, boolean>;
};

/** @deprecated Renamed to {@link BillingUiStatus}. Kept for callers not yet migrated. */
export type StripeBillingUiStatus = BillingUiStatus;

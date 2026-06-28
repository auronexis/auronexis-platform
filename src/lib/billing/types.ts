import type { OrganizationSubscription } from "@/types/database";
import type { PlanKey } from "@/lib/billing/plans";
import {
  isActiveSubscriptionStatus,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/lib/stripe/types";

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
  invoices: CustomerInvoiceView[];
  discounts: DiscountPreview[];
  prorationPreviews: ProrationPreview[];
  forecastStatus: "healthy" | "warning" | "critical";
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
  isActive: boolean;
  planLabel: string;
  currentPlanKey: PlanKey | null;
  statusLabel: string;
  paymentStatusLabel: string;
  renewalDate: string | null;
  billingPeriodLabel: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
};

export function formatBillingDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatBillingDateTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function resolvePaymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "active":
    case "trialing":
      return "Paid";
    case "past_due":
    case "unpaid":
      return "Payment failed";
    case "canceled":
      return "Cancelled";
    case "incomplete":
    case "incomplete_expired":
      return "Incomplete";
    default:
      return "No payment on file";
  }
}

export function buildBillingOverview(
  subscription: OrganizationSubscription | null,
  organizationPlan: string,
  currentPlanName: string | null,
  currentPlanKey: PlanKey | null,
): BillingOverview {
  const status = subscription?.status ?? "inactive";
  const isActive = isActiveSubscriptionStatus(status);
  const planLabel = currentPlanName ?? "Starter";

  const billingPeriodStart = formatBillingDate(subscription?.current_period_start);
  const billingPeriodEnd = formatBillingDate(subscription?.current_period_end);
  const billingPeriodLabel =
    billingPeriodStart && billingPeriodEnd
      ? `${billingPeriodStart} – ${billingPeriodEnd}`
      : null;

  return {
    subscription,
    hasSubscription: Boolean(subscription?.stripe_subscription_id),
    isActive,
    planLabel,
    currentPlanKey,
    statusLabel: SUBSCRIPTION_STATUS_LABELS[status] ?? status,
    paymentStatusLabel: resolvePaymentStatusLabel(status),
    renewalDate: billingPeriodEnd,
    billingPeriodLabel,
    trialEndsAt: subscription?.trial_ends_at ?? null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
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

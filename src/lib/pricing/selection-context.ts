import { hasOpenUnpaidInvoice } from "@/lib/billing/checkout-guards";
import { safeGetPlanByKey, type PlanKey, type SubscriptionPlanDefinition } from "@/lib/billing/plans";
import type { BillingOverview, CustomerInvoiceView } from "@/lib/billing/types";
import { findLatestOpenInvoice } from "@/lib/billing/status";
import { buildBillingOverview } from "@/lib/billing/types";

export type PricingSelectionContext = {
  currentPlanKey: PlanKey | null;
  currentPlan: SubscriptionPlanDefinition | null;
  currentPlanName: string | null;
  /** True when subscription is active or trialing (current plan badge). */
  isUsable: boolean;
  isCurrentPlan: boolean;
  hasPaymentProblem: boolean;
  isPaymentPending: boolean;
  hasOpenUnpaidInvoice: boolean;
  latestOpenInvoiceUrl: string | null;
  canManage: boolean;
  usedSeats: number;
  usedClients: number;
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
};

export function createFallbackPricingSelection(
  canManage = false,
): PricingSelectionContext {
  const overview = buildBillingOverview(null, "starter", null, null);
  const invoices: CustomerInvoiceView[] = [];

  return {
    currentPlanKey: null,
    currentPlan: null,
    currentPlanName: null,
    isUsable: false,
    isCurrentPlan: false,
    hasPaymentProblem: false,
    isPaymentPending: false,
    hasOpenUnpaidInvoice: false,
    latestOpenInvoiceUrl: null,
    canManage,
    usedSeats: 0,
    usedClients: 0,
    overview,
    invoices,
  };
}

/** Build pricing card context — shared by server page and client grid. Never throws. */
export function buildPricingSelectionContext(input: {
  overview: BillingOverview;
  invoices?: CustomerInvoiceView[] | null;
  canManage: boolean;
  usedSeats?: number;
  usedClients?: number;
  currentPlanKey?: PlanKey | null;
  currentPlan?: SubscriptionPlanDefinition | null;
  currentPlanName?: string | null;
}): PricingSelectionContext {
  try {
    const invoices = Array.isArray(input.invoices) ? input.invoices : [];
    const latestOpen = findLatestOpenInvoice(invoices);
    const currentPlanKey =
      input.currentPlanKey !== undefined ? input.currentPlanKey : input.overview.currentPlanKey;
    const currentPlan =
      input.currentPlan !== undefined
        ? input.currentPlan
        : currentPlanKey
          ? safeGetPlanByKey(currentPlanKey)
          : null;
    const isUsable = Boolean(input.overview?.isUsable);

    return {
      currentPlanKey: currentPlanKey ?? null,
      currentPlan: currentPlan ?? null,
      currentPlanName:
        input.currentPlanName ?? currentPlan?.name ?? input.overview?.planLabel ?? null,
      isUsable,
      isCurrentPlan: false,
      hasPaymentProblem: Boolean(input.overview?.hasPaymentProblem),
      isPaymentPending: Boolean(input.overview?.isPaymentPending),
      hasOpenUnpaidInvoice: hasOpenUnpaidInvoice(invoices),
      latestOpenInvoiceUrl: latestOpen?.hostedInvoiceUrl ?? null,
      canManage: input.canManage,
      usedSeats: input.usedSeats ?? 0,
      usedClients: input.usedClients ?? 0,
      overview: input.overview,
      invoices,
    };
  } catch (error) {
    console.warn("[plans] buildPricingSelectionContext failed — using fallback", {
      message: error instanceof Error ? error.message : String(error),
    });

    return createFallbackPricingSelection(input.canManage);
  }
}

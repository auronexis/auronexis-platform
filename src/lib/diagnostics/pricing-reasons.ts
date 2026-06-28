import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import type { StripeEnvDiagnostics } from "@/lib/diagnostics/types";

const PLAN_PRICE_ENV_MAP: Record<PlanKey, keyof StripeEnvDiagnostics> = {
  starter: "starterPriceId",
  professional: "professionalPriceId",
  business: "businessPriceId",
  enterprise: "enterprisePriceId",
};

function isStripeCheckoutReady(stripeEnv: StripeEnvDiagnostics): boolean {
  return stripeEnv.secretKey.present && stripeEnv.publishableKey.present;
}

export function getPricingButtonDisabledReasons(input: {
  planKey: PlanKey;
  currentPlanKey: PlanKey | null;
  isActive: boolean;
  canManage: boolean;
  isLoading: boolean;
  isCurrent: boolean;
  seatBlockMessage: string | null;
  stripeEnv: StripeEnvDiagnostics;
}): string[] {
  const reasons: string[] = [];

  if (!input.canManage) {
    reasons.push("Permission denied — organization owner or admin required.");
  }

  if (input.isCurrent) {
    reasons.push("This is your organization's current plan.");
  }

  if (input.isLoading) {
    reasons.push("Checkout is in progress.");
  }

  if (input.seatBlockMessage) {
    reasons.push(input.seatBlockMessage);
  }

  const priceEnvKey = PLAN_PRICE_ENV_MAP[input.planKey];
  const priceEnv = input.stripeEnv[priceEnvKey];

  if (!priceEnv.present) {
    reasons.push(`Missing ${priceEnv.name} for the ${getPlanByKey(input.planKey).name} plan.`);
  }

  if (!input.stripeEnv.secretKey.present) {
    reasons.push("STRIPE_SECRET_KEY is not configured.");
  }

  if (!input.stripeEnv.publishableKey.present) {
    reasons.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured.");
  }

  if (!isStripeCheckoutReady(input.stripeEnv) && !input.isCurrent && input.canManage && reasons.length === 0) {
    reasons.push("Stripe checkout environment is not fully configured.");
  }

  return reasons;
}

export function isPricingButtonDisabled(reasons: string[]): boolean {
  return reasons.length > 0;
}

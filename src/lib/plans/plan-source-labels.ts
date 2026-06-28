import type { PlanResolutionSource } from "@/lib/plans/types";

export const PLAN_SOURCE_LABELS: Record<PlanResolutionSource, string> = {
  active_subscription: "Active Stripe subscription",
  starter_fallback: "Starter fallback (no active mapped subscription)",
  unmapped_price_id: "Active subscription with unmapped Stripe price ID",
  dev_override: "Development override (DEV_FORCE_PLAN)",
};

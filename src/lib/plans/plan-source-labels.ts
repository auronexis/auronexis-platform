import type { PlanResolutionSource } from "@/lib/plans/types";

export const PLAN_SOURCE_LABELS: Record<PlanResolutionSource, string> = {
  active_subscription: "Active Mollie subscription",
  starter_fallback: "No active subscription (Free / unpaid baseline limits apply)",
  unmapped_price_id: "Active subscription with unmapped provider price ID",
  dev_override: "Development override (DEV_FORCE_PLAN)",
  plan_override: "Enterprise plan override (manual approval)",
};

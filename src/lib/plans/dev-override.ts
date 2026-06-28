import "server-only";

import type { PlanKey } from "@/lib/billing/plans";

const VALID_DEV_PLANS: PlanKey[] = ["starter", "professional", "business", "enterprise"];

/** Local-only plan override — ignored in production. Does not touch Stripe or the database. */
export function getDevForcePlanOverride(): PlanKey | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const raw = process.env.DEV_FORCE_PLAN?.trim().toLowerCase();

  if (!raw) {
    return null;
  }

  if (VALID_DEV_PLANS.includes(raw as PlanKey)) {
    return raw as PlanKey;
  }

  return null;
}

export function isDevForcePlanConfigured(): boolean {
  return getDevForcePlanOverride() !== null;
}

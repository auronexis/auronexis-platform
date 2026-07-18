import "server-only";

import {
  getBillingUiStatus,
  getBillingUiStatusWithPortalFeatures,
} from "@/lib/billing/ui-status";

/**
 * @deprecated Thin re-export for callers not yet migrated to
 * "@/lib/billing/ui-status". Stripe removed from active billing — this
 * resolves Paddle readiness only. Historical archive only; do not add new
 * Stripe-specific logic here.
 */
export const getStripeBillingUiStatus = getBillingUiStatus;

/**
 * @deprecated Use getBillingUiStatusWithPortalFeatures from
 * "@/lib/billing/ui-status" instead.
 */
export const getStripeBillingUiStatusWithPortalFeatures = getBillingUiStatusWithPortalFeatures;

"use server";

import { requireSession } from "@/lib/auth/session";
import {
  getPaddleCheckoutSyncStatus,
  type PaddleCheckoutSyncStatus,
} from "@/lib/billing/checkout-sync-status";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";

export type CheckoutSyncStatusActionResult =
  | { ok: true; status: PaddleCheckoutSyncStatus }
  | { ok: false; error: string };

/** Pollable sync status for post-checkout UX. Does not grant entitlements. */
export async function getPaddleCheckoutSyncStatusAction(): Promise<CheckoutSyncStatusActionResult> {
  try {
    const session = await requireSession();
    const status = await getPaddleCheckoutSyncStatus(session);
    return { ok: true, status };
  } catch (error) {
    return {
      ok: false,
      error: sanitizeBillingCustomerError(error, "Unable to refresh billing status."),
    };
  }
}

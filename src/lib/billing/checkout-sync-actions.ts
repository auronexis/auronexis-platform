"use server";

import { requireSession } from "@/lib/auth/session";
import {
  getCheckoutSyncStatus,
  type CheckoutSyncStatus,
} from "@/lib/billing/checkout-sync-status";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";

export type CheckoutSyncStatusActionResult =
  | { ok: true; status: CheckoutSyncStatus }
  | { ok: false; error: string };

/** Pollable sync status for post-checkout UX. Does not grant entitlements. */
export async function getCheckoutSyncStatusAction(): Promise<CheckoutSyncStatusActionResult> {
  try {
    const session = await requireSession();
    const status = await getCheckoutSyncStatus(session);
    return { ok: true, status };
  } catch (error) {
    return {
      ok: false,
      error: sanitizeBillingCustomerError(error, "Unable to refresh billing status."),
    };
  }
}

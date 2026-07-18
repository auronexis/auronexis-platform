"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import type { BillingMaintenanceActionResult } from "@/lib/billing/maintenance";
import { neutralizeStaleStripeCheckoutRemnants } from "@/lib/billing/maintenance";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import { AuthorizationError } from "@/lib/rbac/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export type BillingMaintenanceActionState = BillingMaintenanceActionResult & {
  error?: string;
};

const REVALIDATE_PATHS = [
  "/settings/billing",
  "/settings/billing/diagnostics",
  "/settings/plans",
] as const;

function revalidateBillingPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function runMaintenanceAction(
  action: () => Promise<BillingMaintenanceActionResult>,
): Promise<BillingMaintenanceActionState> {
  try {
    const session = await requireSession();

    if (!canManageOrganizationSettings(session)) {
      throw new AuthorizationError();
    }

    const result = await action();
    revalidateBillingPaths();
    return result;
  } catch (error) {
    return {
      success: false,
      message: sanitizeBillingCustomerError(error, "Billing maintenance action failed."),
      error: sanitizeBillingCustomerError(error, "Billing maintenance action failed."),
    };
  }
}

/**
 * Neutralize abandoned Stripe checkout remnants so they cannot block Paddle.
 * Stripe API sync actions (refresh/resync) have been removed — Stripe is no
 * longer an active billing provider.
 */
export async function neutralizeStaleStripeCheckoutAction(): Promise<BillingMaintenanceActionState> {
  return runMaintenanceAction(async () => {
    const session = await requireSession();
    if (getActiveBillingProvider() !== "paddle") {
      return {
        success: false,
        message: "Stale Stripe neutralization requires BILLING_PROVIDER=paddle.",
      };
    }
    return neutralizeStaleStripeCheckoutRemnants(session);
  });
}

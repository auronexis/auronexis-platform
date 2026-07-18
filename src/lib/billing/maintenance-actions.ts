"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import type { BillingMaintenanceActionResult } from "@/lib/billing/maintenance";
import {
  clearStaleLocalInvoicesFromStripe,
  markInvoiceIgnoredForCheckout,
  neutralizeStaleStripeCheckoutRemnants,
  refreshBillingFromStripe,
  resyncCurrentSubscriptionFromStripe,
  resyncInvoicesFromStripe,
} from "@/lib/billing/maintenance";
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

export async function refreshBillingFromStripeAction(): Promise<BillingMaintenanceActionState> {
  return runMaintenanceAction(async () => {
    if (getActiveBillingProvider() === "paddle") {
      return {
        success: false,
        message:
          "Stripe refresh is disabled while Paddle is the active billing provider. Use Paddle diagnostics instead.",
      };
    }
    const session = await requireSession();
    return refreshBillingFromStripe(session);
  });
}

export async function resyncCurrentSubscriptionAction(): Promise<BillingMaintenanceActionState> {
  return runMaintenanceAction(async () => {
    if (getActiveBillingProvider() === "paddle") {
      return {
        success: false,
        message:
          "Stripe subscription re-sync is disabled while Paddle is the active billing provider.",
      };
    }
    const session = await requireSession();
    return resyncCurrentSubscriptionFromStripe(session);
  });
}

export async function resyncInvoicesAction(): Promise<BillingMaintenanceActionState> {
  return runMaintenanceAction(async () => {
    if (getActiveBillingProvider() === "paddle") {
      return {
        success: false,
        message: "Stripe invoice re-sync is disabled while Paddle is the active billing provider.",
      };
    }
    const session = await requireSession();
    return resyncInvoicesFromStripe(session);
  });
}

export async function clearStaleLocalInvoicesAction(): Promise<BillingMaintenanceActionState> {
  return runMaintenanceAction(async () => {
    const session = await requireSession();
    return clearStaleLocalInvoicesFromStripe(session);
  });
}

export async function markInvoiceIgnoredAction(
  stripeInvoiceId: string,
): Promise<BillingMaintenanceActionState> {
  return runMaintenanceAction(async () => {
    const session = await requireSession();
    return markInvoiceIgnoredForCheckout(session, stripeInvoiceId);
  });
}

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

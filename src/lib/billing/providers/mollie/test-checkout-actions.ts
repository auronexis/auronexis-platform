"use server";

import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import {
  createMollieTestCheckoutPayload,
  getMollieTestDiagnostics,
  isMollieSelfServePlanKey,
  isMollieTestCheckoutConfigured,
  type MollieSelfServePlanKey,
  type MollieTestCheckoutPayload,
  type MollieTestDiagnostics,
} from "@/lib/billing/providers/mollie/checkout";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export type MollieTestCheckoutActionResult = {
  error?: string;
  checkout?: MollieTestCheckoutPayload;
};

export type MollieTestDiagnosticsActionResult = {
  error?: string;
  diagnostics?: MollieTestDiagnostics;
};

/**
 * Owner/admin-only Mollie TEST checkout launcher.
 * Validates plan key server-side; never trusts arbitrary browser input.
 */
export async function createMollieTestCheckoutAction(
  planKey: string,
): Promise<MollieTestCheckoutActionResult> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  if (!isMollieTestCheckoutConfigured()) {
    return {
      error:
        "Mollie TEST checkout is not configured. Set MOLLIE_API_KEY with a test_ prefix in the server environment.",
    };
  }

  if (!isMollieSelfServePlanKey(planKey)) {
    return { error: "Invalid plan. Enterprise is manual-only; choose Professional or Business." };
  }

  try {
    const checkout = await createMollieTestCheckoutPayload({
      organizationId: session.organization.id,
      organizationName: session.organization.name,
      ownerEmail: session.user.email ?? "billing@example.com",
      planKey: planKey as MollieSelfServePlanKey,
    });
    return { checkout };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Mollie test checkout.";
    if (/TEST mode credentials/i.test(message)) {
      return { error: "Mollie TEST mode credentials required. Live keys are rejected." };
    }
    if (/Enterprise and invite-only/i.test(message)) {
      return { error: "Enterprise is manual-only and not available via Mollie checkout." };
    }
    return { error: "Unable to start Mollie test checkout." };
  }
}

export async function getMollieTestDiagnosticsAction(): Promise<MollieTestDiagnosticsActionResult> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  try {
    const diagnostics = await getMollieTestDiagnostics(session.organization.id);
    return { diagnostics };
  } catch {
    return { error: "Unable to load Mollie test diagnostics." };
  }
}

export async function refreshMollieTestStateAction(): Promise<MollieTestDiagnosticsActionResult> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  if (!isMollieTestCheckoutConfigured()) {
    return { error: "Mollie TEST checkout is not configured." };
  }

  try {
    const { getMollieTestSubscriptionForOrg } = await import("@/lib/billing/providers/mollie/sync");
    const { reconcileMolliePaymentWebhook } = await import("@/lib/billing/providers/mollie/webhooks");

    const row = await getMollieTestSubscriptionForOrg(session.organization.id);
    if (row?.first_payment_id?.startsWith("tr_")) {
      await reconcileMolliePaymentWebhook(row.first_payment_id);
    }

    const diagnostics = await getMollieTestDiagnostics(session.organization.id);
    return { diagnostics };
  } catch {
    return { error: "Unable to refresh Mollie test state." };
  }
}

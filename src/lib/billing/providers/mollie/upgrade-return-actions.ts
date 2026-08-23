"use server";

import { requireSession } from "@/lib/auth/session";
import { resolveMollieProductionReturnPageState } from "@/lib/billing/providers/mollie/return-state";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export type UpgradeReturnPollStatus = {
  kind: "upgrade_success" | "upgrade_confirming" | "upgrade_payment_failed" | "other";
  appliedPlanName: string | null;
  statusLabel: string;
};

/**
 * Bounded poll target for upgrade return page.
 * Reads authoritative org subscription only — never activates from query params.
 */
export async function getMollieUpgradeReturnPollStatusAction(): Promise<{
  ok: boolean;
  status: UpgradeReturnPollStatus | null;
}> {
  try {
    const session = await requireSession();
    if (!canManageOrganizationSettings(session)) {
      return { ok: false, status: null };
    }

    const state = await resolveMollieProductionReturnPageState({
      organizationId: session.organization.id,
      purpose: "upgrade",
    });

    if (state.kind === "upgrade_success") {
      return {
        ok: true,
        status: {
          kind: "upgrade_success",
          appliedPlanName: state.appliedPlanName,
          statusLabel: state.statusLabel,
        },
      };
    }

    if (state.kind === "upgrade_payment_failed") {
      return {
        ok: true,
        status: {
          kind: "upgrade_payment_failed",
          appliedPlanName: null,
          statusLabel: state.statusLabel,
        },
      };
    }

    if (state.kind === "upgrade_confirming") {
      return {
        ok: true,
        status: {
          kind: "upgrade_confirming",
          appliedPlanName: null,
          statusLabel: state.statusLabel,
        },
      };
    }

    return {
      ok: true,
      status: {
        kind: "other",
        appliedPlanName: null,
        statusLabel: state.statusLabel,
      },
    };
  } catch {
    return { ok: false, status: null };
  }
}

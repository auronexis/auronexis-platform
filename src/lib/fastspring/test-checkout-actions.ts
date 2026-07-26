"use server";

import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import {
  createFastSpringTestCheckoutPayload,
  isFastSpringStoreConfigured,
} from "@/lib/fastspring/test-checkout";
import { normalizeFastSpringProductPath } from "@/lib/fastspring/products";
import type { FastSpringTestCheckoutPayload } from "@/lib/fastspring/test-checkout-types";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export type FastSpringTestCheckoutActionResult = {
  error?: string;
  checkout?: FastSpringTestCheckoutPayload;
};

/**
 * Owner/admin-only FastSpring TEST checkout launcher.
 * Validates product path server-side; never trusts arbitrary browser paths.
 */
export async function createFastSpringTestCheckoutAction(
  productPath: string,
): Promise<FastSpringTestCheckoutActionResult> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  if (!isFastSpringStoreConfigured()) {
    return {
      error:
        "FastSpring test checkout is not configured. Set FASTSPRING_STORE_ID in the server environment.",
    };
  }

  const normalizedPath = normalizeFastSpringProductPath(productPath);
  if (!normalizedPath) {
    return { error: "Invalid FastSpring product path." };
  }

  try {
    const checkout = createFastSpringTestCheckoutPayload({
      organizationId: session.organization.id,
      userId: session.user.id,
      productPath: normalizedPath,
    });
    return { checkout };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start FastSpring test checkout.";
    // Never return secrets; keep messages generic when unexpected.
    if (/Missing required environment variable|Invalid FASTSPRING_STORE_ID/i.test(message)) {
      return {
        error:
          "FastSpring test checkout is not configured. Set FASTSPRING_STORE_ID in the server environment.",
      };
    }
    if (/Invalid (organization_id|user_id|internal_plan)/i.test(message)) {
      return { error: "Unable to start FastSpring test checkout for this workspace." };
    }
    return { error: "Unable to start FastSpring test checkout." };
  }
}

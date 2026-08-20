import "server-only";

import {
  SUPPORT_CONTACT_CARD,
  type BillingContactCardContent,
} from "@/lib/billing/billing-contact";
import { getCheckoutSyncStatus } from "@/lib/billing/checkout-sync-status";
import {
  getBillingDashboardData,
  getOrganizationSubscription,
} from "@/lib/billing/queries";
import { getOrganizationBillingProvider } from "@/lib/billing/provider-selection";
import { getBillingUiStatusWithPortalFeatures } from "@/lib/billing/ui-status";
import { resolveLocaleFromOrganization } from "@/lib/i18n";
import { getOrganizationPlanUsageSummary } from "@/lib/plans/queries";
import { getOrganizationSeatUsageFromSession } from "@/lib/seats/queries";
import { getEnterpriseStatus } from "@/lib/enterprise/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  isCheckoutSuccessParam,
  CHECKOUT_SUCCESS_MESSAGE,
} from "@/lib/billing/checkout-success";
import type { SessionContext } from "@/lib/tenancy/context";

export type BillingSettingsSearchParams = {
  success?: string;
  checkout?: string;
  cancelled?: string;
  session_id?: string;
  contact?: string;
};

export type BillingSettingsPageModel = Awaited<ReturnType<typeof loadBillingSettingsPageModel>>;

export function resolveBillingContactCard(
  contact?: string,
): BillingContactCardContent | null {
  if (contact === "support") {
    return SUPPORT_CONTACT_CARD;
  }

  return null;
}

export function resolveBillingCheckoutMessages(input: {
  canManage: boolean;
  checkout?: string;
  success?: string;
}): {
  checkoutSuccessMessage: string | null;
  showLegacySuccessBanner: boolean;
  checkoutSuccessParam: boolean;
  pollCheckoutSuccess: boolean;
} {
  const checkoutSuccessParam = isCheckoutSuccessParam(input.checkout);
  let checkoutSuccessMessage: string | null = null;
  let showLegacySuccessBanner = false;

  if (checkoutSuccessParam) {
    checkoutSuccessMessage = CHECKOUT_SUCCESS_MESSAGE;
  } else if (input.success === "1" && input.canManage) {
    checkoutSuccessMessage = CHECKOUT_SUCCESS_MESSAGE;
    showLegacySuccessBanner = false;
  } else if (input.success === "1") {
    checkoutSuccessMessage = "Payment received. Your plan may update shortly.";
    showLegacySuccessBanner = true;
  }

  return {
    checkoutSuccessMessage,
    showLegacySuccessBanner,
    checkoutSuccessParam,
    pollCheckoutSuccess: checkoutSuccessParam || input.success === "1",
  };
}

/** Load all data for /settings/billing — page stays composition-only. */
export async function loadBillingSettingsPageModel(
  session: SessionContext,
  params: BillingSettingsSearchParams,
) {
  const canManage = canManageOrganizationSettings(session);
  const subscription = await getOrganizationSubscription(session);
  const activeProvider = getOrganizationBillingProvider({
    organizationId: session.organization.id,
    subscription,
  });
  const stripeStatus = await getBillingUiStatusWithPortalFeatures({
    organizationId: session.organization.id,
    organizationProvider: activeProvider,
  });
  const messages = resolveBillingCheckoutMessages({
    canManage,
    checkout: params.checkout,
    success: params.success,
  });

  const [dashboard, seatUsage, enterpriseStatus, checkoutSyncStatus] = await Promise.all([
    getBillingDashboardData(session),
    getOrganizationSeatUsageFromSession(session),
    getEnterpriseStatus(session.organization.id),
    getCheckoutSyncStatus(session),
  ]);
  const planUsage = await getOrganizationPlanUsageSummary(
    session,
    seatUsage.used,
    seatUsage.limit,
  );

  return {
    canManage,
    activeProvider,
    stripeStatus,
    dashboard,
    seatUsage,
    planUsage,
    enterpriseStatus,
    checkoutSyncStatus,
    locale: resolveLocaleFromOrganization(session.organization),
    cancelled: params.cancelled === "1",
    billingContactCard: resolveBillingContactCard(
      params.contact === "support" ? "support" : undefined,
    ),
    enterpriseAutoOpen: params.contact === "enterprise",
    ...messages,
  };
}

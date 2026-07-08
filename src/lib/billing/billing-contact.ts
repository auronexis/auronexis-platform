import { SALES_EMAIL, SUPPORT_EMAIL } from "@/lib/company/contact";
import { canAccessModule } from "@/lib/rbac/permissions";
import type { UserRole } from "@/types/database";

export const ENTERPRISE_BILLING_CONTACT_PATH = "/settings/billing?contact=enterprise";
export const SUPPORT_BILLING_CONTACT_PATH = "/settings/billing?contact=support";

export type BillingContactCardContent = {
  title: string;
  text: string;
  email: string;
};

export const ENTERPRISE_CONTACT_CARD: BillingContactCardContent = {
  title: "Enterprise onboarding",
  text: `Enterprise onboarding is handled manually. Contact ${SALES_EMAIL} and we will help you configure custom onboarding, seats, client limits, and billing.`,
  email: SALES_EMAIL,
};

export const SUPPORT_CONTACT_CARD: BillingContactCardContent = {
  title: "Contact support",
  text: `Contact ${SUPPORT_EMAIL} for billing, workspace, or account support.`,
  email: SUPPORT_EMAIL,
};

function resolveBillingContactHref(
  role: UserRole | undefined,
  billingPath: string,
  mailto: string,
): string {
  if (role && canAccessModule(role, "settings", "read")) {
    return billingPath;
  }

  return mailto;
}

/** Dashboard Enterprise contact route — keeps authenticated users in the app shell. */
export function resolveEnterpriseContactHref(role?: UserRole): string {
  return resolveBillingContactHref(
    role,
    ENTERPRISE_BILLING_CONTACT_PATH,
    `mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Enterprise plan inquiry")}`,
  );
}

/** Dashboard support contact route — keeps authenticated users in the app shell. */
export function resolveSupportContactHref(role?: UserRole): string {
  return resolveBillingContactHref(
    role,
    SUPPORT_BILLING_CONTACT_PATH,
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Workspace support request")}`,
  );
}

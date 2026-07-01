import { SALES_EMAIL } from "@/lib/company/contact";
import { canAccessModule } from "@/lib/rbac/permissions";
import type { UserRole } from "@/types/database";

export const ENTERPRISE_BILLING_CONTACT_PATH = "/settings/billing?contact=enterprise";

export const ENTERPRISE_CONTACT_MESSAGE = `Enterprise onboarding is handled manually. Contact ${SALES_EMAIL}.`;

/** Dashboard Enterprise contact route — keeps authenticated users in the app shell. */
export function resolveEnterpriseContactHref(role: UserRole): string {
  if (canAccessModule(role, "sales", "read")) {
    return "/sales";
  }

  if (canAccessModule(role, "settings", "read")) {
    return ENTERPRISE_BILLING_CONTACT_PATH;
  }

  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Enterprise plan inquiry")}`;
}

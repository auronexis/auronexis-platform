/**
 * Transactional email categories for Auroranexis platform mail.
 * Marketing / newsletter / promotions are separate and must never gate these.
 */

export const EMAIL_CATEGORIES = {
  AUTH: "auth",
  ACCOUNT: "account",
  BILLING_SYSTEM: "billing_system",
} as const;

export type EmailCategory = (typeof EMAIL_CATEGORIES)[keyof typeof EMAIL_CATEGORIES];

/** Template keys used for idempotent delivery claims. */
export const EMAIL_TEMPLATE_KEYS = {
  WELCOME: "welcome",
  /** Dynamic keys: plan_change_*, subscription_cancellation_*, subscription_ended:* */
  PLAN_CHANGE_SCHEDULED_PREFIX: "plan_change_scheduled",
  PLAN_CHANGE_APPLIED_PREFIX: "plan_change_applied",
} as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[keyof typeof EMAIL_TEMPLATE_KEYS];

/** AUTH + ACCOUNT + BILLING_SYSTEM — never blocked by marketing opt-out. */
export function isTransactionalRequiredCategory(category: EmailCategory): boolean {
  return (
    category === EMAIL_CATEGORIES.AUTH ||
    category === EMAIL_CATEGORIES.ACCOUNT ||
    category === EMAIL_CATEGORIES.BILLING_SYSTEM
  );
}

/**
 * Legacy billing row quarantine — historical stripe/paddle/fastspring rows remain
 * in organization_subscriptions for audit but must never drive entitlements,
 * checkout, reconciliation, or current billing UI.
 */

import type { OrganizationSubscription } from "@/types/database";

export const LEGACY_BILLING_PROVIDERS = ["stripe", "paddle", "fastspring"] as const;

export type LegacyBillingProvider = (typeof LEGACY_BILLING_PROVIDERS)[number];

export type LegacyQuarantineSubscriptionFields = {
  billing_provider?: string | null;
  legacy_archived?: boolean | null;
};

export function isLegacyBillingProvider(
  provider: string | null | undefined,
): provider is LegacyBillingProvider {
  return (
    provider === "stripe" || provider === "paddle" || provider === "fastspring"
  );
}

/**
 * True when a row must not grant paid access or current billing authority.
 * Code treats all legacy providers as quarantined even before DB migration applies flags.
 */
export function isLegacyQuarantinedSubscriptionRow(
  row: LegacyQuarantineSubscriptionFields | null | undefined,
): boolean {
  if (!row) {
    return false;
  }

  if (row.legacy_archived === true) {
    return true;
  }

  return isLegacyBillingProvider(row.billing_provider);
}

/** True only for non-archived Mollie rows — sole paid entitlement authority. */
export function isAuthoritativeSubscriptionRow(
  row: LegacyQuarantineSubscriptionFields | null | undefined,
): row is OrganizationSubscription {
  if (!row) {
    return false;
  }

  return row.billing_provider === "mollie" && row.legacy_archived !== true;
}

export function filterAuthoritativeSubscriptionRows<
  T extends LegacyQuarantineSubscriptionFields,
>(rows: T[]): T[] {
  return rows.filter((row) => isAuthoritativeSubscriptionRow(row));
}

/** Provider-resolution hint — never use raw ORDER BY updated_at rows[0]. */
export function pickSubscriptionProviderHintRow<
  T extends LegacyQuarantineSubscriptionFields,
>(rows: T[]): T | null {
  const authoritative = filterAuthoritativeSubscriptionRows(rows);
  return (
    authoritative.find((row) => row.billing_provider === "mollie") ??
    authoritative[0] ??
    null
  );
}

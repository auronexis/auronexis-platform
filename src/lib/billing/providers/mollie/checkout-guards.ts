/**
 * Production Mollie checkout preflight guards.
 * Pure helpers (no server-only) so source + unit tests can exercise retry/duplicate rules.
 */

import { isLegacyQuarantinedSubscriptionRow } from "@/lib/billing/legacy-quarantine";
import {
  hasVerifiedMollieSubscription,
  isMollieBackedSubscription,
} from "@/lib/billing/active-billing";
import { isSubscriptionUsable } from "@/lib/billing/status";
import type { OrganizationSubscription } from "@/types/database";

/**
 * Refuse Mollie checkout only for genuinely conflicting non-Mollie providers.
 * Does NOT block:
 * - no row
 * - legacy-quarantined rows (stripe/paddle/fastspring / legacy_archived)
 * - Mollie rows (including abandoned/expired first-payment remnants)
 * - null / empty / "none" provider
 *
 * Duplicate Mollie protection is owned by assertNoDuplicateMollieSubscription.
 */
export function assertNoFastSpringConflict(row: OrganizationSubscription | null): void {
  if (!row || isLegacyQuarantinedSubscriptionRow(row)) {
    return;
  }

  const provider = (row.billing_provider ?? "").trim().toLowerCase();
  if (!provider || provider === "none" || provider === "mollie") {
    return;
  }

  throw new Error(
    "Refusing Mollie checkout — organization already has a subscription from another billing provider (provider_conflict).",
  );
}

/**
 * Duplicate purchase protection: refuse a second first payment when an active
 * or suspended Mollie subscription already exists (use plan change / support instead).
 */
export function assertNoDuplicateMollieSubscription(row: OrganizationSubscription | null): void {
  if (!row || !isMollieBackedSubscription(row)) {
    return;
  }
  if (!hasVerifiedMollieSubscription(row)) {
    return;
  }
  const status = (row.provider_status ?? row.status ?? "").toLowerCase();
  if (status === "active" || isSubscriptionUsable(status)) {
    throw new Error(
      "A Mollie subscription already exists for this workspace. Use plan change instead of a new checkout (duplicate_mollie).",
    );
  }
  if (status === "suspended" || status === "past_due") {
    throw new Error(
      "A Mollie subscription already exists for this workspace. Resolve payment issues instead of starting a second subscription (existing_subscription).",
    );
  }
}

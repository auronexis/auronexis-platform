/**
 * Mollie Phase 3/4 controlled rollout — per-org enablement and NEW-subscription cutover prep.
 * Never flips the global active provider away from FastSpring.
 * Never overwrites existing FastSpring or Mollie ownership.
 *
 * Kill switches (independent):
 * - MOLLIE_BILLING_ROLLOUT — master switch for NEW Mollie checkout eligibility
 * - MOLLIE_BILLING_ORG_ALLOWLIST — per-org allowlist (when default-for-new is off)
 * - MOLLIE_BILLING_DEFAULT_FOR_NEW — optional global NEW-sub cutover (still requires ROLLOUT)
 * - MOLLIE_LIVE_CHARGING_ENABLED — LIVE API payment writes only (separate from rollout)
 *
 * Rollback NEW Mollie: set MOLLIE_BILLING_ROLLOUT=false (and/or clear allowlist / default-for-new).
 * Existing Mollie-owned organization_subscriptions rows remain Mollie via ownership resolution.
 */

/** Master switch — Mollie self-serve checkout for eligible orgs only. */
export function isMollieBillingRolloutEnabled(): boolean {
  const raw = process.env.MOLLIE_BILLING_ROLLOUT?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/**
 * Explicit LIVE charging gate. Even with a live_ API key, payment writes stay
 * blocked unless this is truthy. Default: off (TEST-only).
 * Independent from MOLLIE_BILLING_ROLLOUT.
 */
export function isMollieLiveChargingEnabled(): boolean {
  const raw = process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/**
 * Prepare global cutover for NEW paid subscriptions only.
 * When truthy AND rollout is on, orgs without existing ownership become Mollie-eligible
 * without being on the allowlist. Existing FastSpring ownership is never overwritten.
 * Default: off. Safe to leave unset in production until operator cutover.
 */
export function isMollieDefaultForNewSubscriptions(): boolean {
  if (!isMollieBillingRolloutEnabled()) {
    return false;
  }
  const raw = process.env.MOLLIE_BILLING_DEFAULT_FOR_NEW?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/** Parse comma/space-separated organization UUID allowlist. */
export function parseMollieBillingOrgAllowlist(
  raw: string | null | undefined = process.env.MOLLIE_BILLING_ORG_ALLOWLIST,
): ReadonlySet<string> {
  const value = raw?.trim() ?? "";
  if (!value) {
    return new Set();
  }

  const ids = value
    .split(/[\s,]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);

  return new Set(ids);
}

export function isOrganizationOnMollieAllowlist(organizationId: string): boolean {
  const allowlist = parseMollieBillingOrgAllowlist();
  if (allowlist.size === 0) {
    return false;
  }
  return allowlist.has(organizationId.trim().toLowerCase());
}

/**
 * Org may use Mollie production checkout for NEW subscriptions when:
 * - rollout is on AND org is allowlisted, OR
 * - rollout is on AND MOLLIE_BILLING_DEFAULT_FOR_NEW is on
 *
 * Does not imply entitlements. Does not override FastSpring ownership
 * (ownership is enforced in provider-selection / checkout-eligibility).
 * Does not enable LIVE charging (MOLLIE_LIVE_CHARGING_ENABLED is separate).
 */
export function isMollieProductionCheckoutEligible(organizationId: string): boolean {
  if (!isMollieBillingRolloutEnabled()) {
    return false;
  }
  if (isOrganizationOnMollieAllowlist(organizationId)) {
    return true;
  }
  return isMollieDefaultForNewSubscriptions();
}

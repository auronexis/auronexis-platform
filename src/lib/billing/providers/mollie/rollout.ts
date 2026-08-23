/**
 * Mollie production rollout — sole active billing provider.
 *
 * Kill switches (independent):
 * - MOLLIE_BILLING_ROLLOUT — master switch for NEW Mollie checkout eligibility
 * - MOLLIE_BILLING_ORG_ALLOWLIST — per-org allowlist (when rollout is off, emergency partial enable)
 * - MOLLIE_BILLING_DEFAULT_FOR_NEW — retained for diagnostics; with rollout on, all new orgs are Mollie
 * - MOLLIE_LIVE_CHARGING_ENABLED — LIVE API payment writes only (separate from rollout)
 *
 * Rollback NEW Mollie: set MOLLIE_BILLING_ROLLOUT=false (allowlist still works for partial enable).
 * Existing Mollie-owned organization_subscriptions rows remain Mollie via ownership resolution.
 * Historical FastSpring ownership is never overwritten.
 */

/** Master switch — Mollie self-serve checkout for eligible orgs. */
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
 * When rollout is on, Mollie is the default for all NEW paid subscriptions
 * (sole-provider mode). Explicit env still accepted for diagnostics/tests.
 */
export function isMollieDefaultForNewSubscriptions(): boolean {
  if (!isMollieBillingRolloutEnabled()) {
    return false;
  }
  const raw = process.env.MOLLIE_BILLING_DEFAULT_FOR_NEW?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no" || raw === "off") {
    return false;
  }
  // Sole-provider default: rollout-on implies default-for-new.
  return true;
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
 * - rollout is on (sole-provider: all orgs), OR
 * - org is allowlisted (emergency partial enable while rollout is off)
 *
 * Does not imply entitlements. Does not override historical FastSpring ownership
 * (ownership is enforced in provider-selection / checkout-eligibility).
 * Does not enable LIVE charging (MOLLIE_LIVE_CHARGING_ENABLED is separate).
 */
export function isMollieProductionCheckoutEligible(organizationId: string): boolean {
  if (isOrganizationOnMollieAllowlist(organizationId)) {
    return true;
  }
  return isMollieBillingRolloutEnabled();
}

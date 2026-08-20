import "server-only";

/**
 * Mollie Phase 3 controlled rollout — per-org enablement only.
 * Never flips the global active provider away from FastSpring.
 */

/** Master switch — Mollie self-serve checkout for allowlisted orgs only. */
export function isMollieBillingRolloutEnabled(): boolean {
  const raw = process.env.MOLLIE_BILLING_ROLLOUT?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/**
 * Explicit LIVE charging gate. Even with a live_ API key, payment writes stay
 * blocked unless this is truthy. Default: off (TEST-only).
 */
export function isMollieLiveChargingEnabled(): boolean {
  const raw = process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase();
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
 * Org may use Mollie production checkout / lifecycle when rollout is on
 * and the org is explicitly allowlisted. Does not imply entitlements.
 */
export function isMollieProductionCheckoutEligible(organizationId: string): boolean {
  return isMollieBillingRolloutEnabled() && isOrganizationOnMollieAllowlist(organizationId);
}

/**
 * Pilot Partner application eligibility — pure decision layer.
 *
 * Application ≠ enrollment ≠ entitlement. Paid commercial access
 * (resolveOrganizationEntitlements.isPaidAccess) blocks self-application.
 * Anonymous prospects and authenticated unpaid orgs remain eligible.
 * Do not probe subscriptions by email for logged-out visitors.
 */

export const PAID_CUSTOMER_PILOT_BLOCK_MESSAGE =
  "Active paid workspaces cannot apply for the Pilot Partner program. Manage your plan in Settings → Billing, or contact sales for a change of program.";

export type PilotApplicationEligibility =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Evaluate whether a Pilot application may proceed.
 *
 * @param hasAuthenticatedOrganization — true only when a workspace session exists
 * @param isPaidAccess — canonical paid/usable access from resolveOrganizationEntitlements
 */
export function evaluatePilotApplicationEligibility(input: {
  hasAuthenticatedOrganization: boolean;
  isPaidAccess: boolean;
}): PilotApplicationEligibility {
  if (!input.hasAuthenticatedOrganization) {
    return { allowed: true };
  }

  if (input.isPaidAccess) {
    return { allowed: false, reason: PAID_CUSTOMER_PILOT_BLOCK_MESSAGE };
  }

  return { allowed: true };
}

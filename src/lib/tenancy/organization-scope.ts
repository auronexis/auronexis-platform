import "server-only";

/**
 * Org-scoped query helpers — prefer these for tenant-bound reads/writes.
 * Always pair with RLS-backed clients (createClient) for user sessions.
 * Admin clients must still filter by organization_id explicitly.
 */

/** Require a non-empty organization id before querying tenant tables. */
export function requireOrganizationId(organizationId: string | null | undefined): string {
  if (!organizationId) {
    throw new Error("organization_id is required for tenant-scoped database access.");
  }
  return organizationId;
}

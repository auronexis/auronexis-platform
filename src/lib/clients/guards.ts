import type { SessionContext } from "@/lib/tenancy/context";
import type { UserRole } from "@/types/database";

/**
 * Permanent client hard-delete is restricted to owner/admin.
 * Routine offboarding uses archive (`clients.write`) instead.
 */
export function canHardDeleteClient(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}

export function sessionCanHardDeleteClient(session: SessionContext): boolean {
  return canHardDeleteClient(session.role);
}

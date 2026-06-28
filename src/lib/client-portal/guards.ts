import type { SessionContext } from "@/lib/tenancy/context";

/** Owner/Admin may create or disable client portal users. */
export function canManagePortalUsers(session: SessionContext): boolean {
  return session.role === "owner" || session.role === "admin";
}

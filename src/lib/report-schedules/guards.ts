import { canAccessModule } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";

/** All org members with reports read access may view schedules. */
export function canViewReportSchedules(session: SessionContext): boolean {
  return canAccessModule(session.role, "reports", "read");
}

/** Owner/Admin may create, edit, deactivate, and generate from schedules. */
export function canManageReportSchedules(session: SessionContext): boolean {
  return session.role === "owner" || session.role === "admin";
}

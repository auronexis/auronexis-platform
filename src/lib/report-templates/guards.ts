import { canAccessModule } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";

/** All org members with reports read access may view templates. */
export function canViewReportTemplates(session: SessionContext): boolean {
  return canAccessModule(session.role, "reports", "read");
}

/** Owner/Admin may create, edit, delete, and set default templates. */
export function canManageReportTemplates(session: SessionContext): boolean {
  return session.role === "owner" || session.role === "admin";
}

import { canAccessModule } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";

/** Owner/Admin may create or update client financial records. */
export function canEditClientFinancials(session: SessionContext): boolean {
  return (
    canAccessModule(session.role, "profitability", "create") ||
    canAccessModule(session.role, "profitability", "update")
  );
}

import { canAccessModule } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";
import type { Risk } from "@/types/database";

/** Owner/Admin may resolve or archive risks. */
export function canManageRiskLifecycle(session: SessionContext): boolean {
  return canAccessModule(session.role, "risks", "delete");
}

/** Whether the current user may edit a specific risk. */
export function canEditRisk(session: SessionContext, risk: Pick<Risk, "owner_user_id">): boolean {
  if (!canAccessModule(session.role, "risks", "update")) {
    return false;
  }

  if (session.role === "staff") {
    return risk.owner_user_id === session.user.id;
  }

  return session.role === "owner" || session.role === "admin";
}

/** Whether the current user may create risks. */
export function canCreateRisk(session: SessionContext): boolean {
  return canAccessModule(session.role, "risks", "create");
}

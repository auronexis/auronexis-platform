import type { SessionContext } from "@/lib/tenancy/context";
import { AuthorizationError } from "@/lib/rbac/guards";
import type { UserRole } from "@/types/database";
import {
  assertPermission,
  hasPermission,
  type Permission,
} from "@/lib/authorization/permissions";

export const ACCESS_DENIED_MESSAGE = "You do not have access to this area.";

export const ACTION_DENIED_MESSAGE = "You do not have permission to perform this action.";

export function sessionHasPermission(session: SessionContext, permission: Permission): boolean {
  return hasPermission(session.role, permission);
}

export function requireSessionPermission(session: SessionContext, permission: Permission): void {
  assertPermission(session.role, permission, ACTION_DENIED_MESSAGE);
}

/** Return a form-safe error object instead of throwing. */
export function assertPermissionSafe(
  role: UserRole,
  permission: Permission,
): { error: string } | null {
  try {
    assertPermission(role, permission, ACTION_DENIED_MESSAGE);
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { error: error.message };
    }

    throw error;
  }
}

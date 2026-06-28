import type { AppModule, PermissionAction } from "./permissions";
import { canAccessModule } from "./permissions";
import type { UserRole } from "@/types/database";

/** Thrown when a user lacks permission for a server-side operation. */
export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";

  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Enforce RBAC on the server — docs/07, docs/10 R12.
 * UI hiding alone is not security.
 */
export function requirePermission(
  role: UserRole,
  module: AppModule,
  action: PermissionAction,
): void {
  if (!canAccessModule(role, module, action)) {
    throw new AuthorizationError();
  }
}

import { ACTION_DENIED_MESSAGE, assertPermissionSafe as assertStringPermissionSafe } from "@/lib/authorization/guards";
import type { Permission } from "@/lib/authorization/permissions";
import { checkPlanFeature } from "@/lib/plans/guards";
import type { PlanFeatureKey } from "@/lib/plans/types";
import { AuthorizationError, requirePermission } from "@/lib/rbac/guards";
import type { AppModule, PermissionAction } from "@/lib/rbac/permissions";
import type { UserRole } from "@/types/database";

export const GENERIC_ACTION_ERROR = "Something went wrong. Please try again.";

/** Return a form-safe plan error instead of throwing AuthorizationError. */
export async function checkPlanFeatureSafe(
  organizationId: string,
  feature: PlanFeatureKey,
): Promise<{ error: string } | null> {
  const check = await checkPlanFeature(organizationId, feature);

  if (check.allowed) {
    return null;
  }

  return { error: check.message ?? "This feature is not available on your plan." };
}

/** Return a form-safe RBAC error instead of throwing AuthorizationError. */
export function requireModulePermissionSafe(
  role: UserRole,
  module: AppModule,
  action: PermissionAction,
): { error: string } | null {
  try {
    requirePermission(role, module, action);
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { error: error.message || ACTION_DENIED_MESSAGE };
    }

    throw error;
  }
}

/**
 * Bridge to the string-permission guard API — same behaviour as
 * `assertPermissionSafe` in `@/lib/authorization/guards`.
 */
export function assertPermissionSafe(
  role: UserRole,
  permission: Permission,
): { error: string } | null {
  return assertStringPermissionSafe(role, permission);
}

/** Convert unexpected action failures into safe customer copy. */
export function resolveActionError(
  error: unknown,
  fallback = GENERIC_ACTION_ERROR,
): { error: string } {
  if (error instanceof AuthorizationError) {
    return { error: error.message || fallback };
  }

  console.error("[action] unexpected error:", error);
  return { error: fallback };
}

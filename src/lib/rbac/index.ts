export type { UserRole, AppUser, Organization, Database } from "@/types/database";

export { AuthorizationError, requirePermission } from "./guards";
export { requireModuleAccess } from "./route-guards";
export {
  USER_ROLES,
  ROLE_HIERARCHY,
  type AppModule,
  type PermissionAction,
  MODULE_PERMISSIONS,
  hasMinimumRole,
  canAccessModule,
  canAccessProfitability,
  canViewRevenue,
  canAccessSettings,
  canManageOrganization,
  canInviteUsers,
  canChangeRoles,
} from "./permissions";

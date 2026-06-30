import type { UserRole } from "@/types/database";
import {
  hasPermission,
  resolveAuthorizationRole,
  type Permission,
} from "@/lib/authorization/permissions";

/** All supported roles — docs/07_RBAC_BLUEPRINT_V1.md */
export const USER_ROLES = ["owner", "admin", "staff", "viewer"] as const satisfies readonly UserRole[];

/** Higher index = higher privilege. Owner is highest. */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 0,
  staff: 1,
  admin: 2,
  owner: 3,
};

export type AppModule =
  | "dashboard"
  | "clients"
  | "workflows"
  | "knowledge"
  | "incidents"
  | "risks"
  | "reports"
  | "profitability"
  | "activity"
  | "team"
  | "pricing"
  | "sales"
  | "settings";

export type PermissionAction = "read" | "create" | "update" | "delete" | "export" | "manage";

type ModulePermission = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
  manage: boolean;
};

const fullAccess: ModulePermission = {
  read: true,
  create: true,
  update: true,
  delete: true,
  export: true,
  manage: true,
};

const readOnly: ModulePermission = {
  read: true,
  create: false,
  update: false,
  delete: false,
  export: false,
  manage: false,
};

const noAccess: ModulePermission = {
  read: false,
  create: false,
  update: false,
  delete: false,
  export: false,
  manage: false,
};

/**
 * Module permission matrix — docs/07_RBAC_BLUEPRINT_V1.md
 * Archive operations map to delete for foundation purposes.
 */
export const MODULE_PERMISSIONS: Record<UserRole, Record<AppModule, ModulePermission>> = {
  owner: {
    dashboard: readOnly,
    clients: fullAccess,
    workflows: fullAccess,
    knowledge: fullAccess,
    incidents: fullAccess,
    risks: fullAccess,
    reports: fullAccess,
    profitability: fullAccess,
    activity: readOnly,
    team: readOnly,
    pricing: readOnly,
    sales: fullAccess,
    settings: fullAccess,
  },
  admin: {
    dashboard: readOnly,
    clients: fullAccess,
    workflows: fullAccess,
    knowledge: fullAccess,
    incidents: fullAccess,
    risks: fullAccess,
    reports: { read: true, create: true, update: true, delete: true, export: true, manage: false },
    profitability: { read: true, create: true, update: true, delete: false, export: false, manage: false },
    activity: readOnly,
    team: readOnly,
    pricing: readOnly,
    sales: { read: true, create: true, update: true, delete: false, export: true, manage: false },
    settings: { read: true, create: false, update: true, delete: false, export: false, manage: false },
  },
  staff: {
    dashboard: readOnly,
    clients: readOnly,
    workflows: { read: true, create: true, update: true, delete: false, export: false, manage: false },
    knowledge: { read: true, create: true, update: true, delete: false, export: false, manage: false },
    incidents: { read: true, create: true, update: true, delete: false, export: false, manage: false },
    risks: { read: true, create: true, update: true, delete: false, export: false, manage: false },
    reports: { read: true, create: true, update: true, delete: false, export: false, manage: false },
    profitability: readOnly,
    activity: readOnly,
    team: readOnly,
    pricing: readOnly,
    sales: readOnly,
    settings: noAccess,
  },
  viewer: {
    dashboard: readOnly,
    clients: readOnly,
    workflows: readOnly,
    knowledge: readOnly,
    incidents: readOnly,
    risks: readOnly,
    reports: readOnly,
    profitability: readOnly,
    activity: readOnly,
    team: readOnly,
    pricing: readOnly,
    sales: noAccess,
    settings: noAccess,
  },
};

/** Maps module actions to Sprint 6 granular permissions when defined. */
const MODULE_ACTION_TO_PERMISSION: Partial<
  Record<AppModule, Partial<Record<PermissionAction, Permission>>>
> = {
  clients: {
    read: "clients.read",
    create: "clients.write",
    update: "clients.write",
    delete: "clients.write",
  },
  settings: {
    read: "settings.read",
    update: "settings.write",
    manage: "settings.write",
  },
  team: {
    read: "users.read",
    create: "users.write",
    update: "users.write",
    delete: "users.write",
    manage: "users.write",
  },
  reports: {
    read: "reports.read",
    create: "reports.write",
    update: "reports.write",
    delete: "reports.write",
    export: "reports.read",
  },
  activity: {
    read: "activity.read",
  },
};

/** Returns true when `role` meets or exceeds `minimumRole` in the hierarchy. */
export function hasMinimumRole(role: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimumRole];
}

/** Check whether a role may perform an action on a module. */
export function canAccessModule(
  role: UserRole,
  module: AppModule,
  action: PermissionAction,
): boolean {
  const mappedPermission = MODULE_ACTION_TO_PERMISSION[module]?.[action];
  if (mappedPermission) {
    return hasPermission(resolveAuthorizationRole(role), mappedPermission);
  }

  return MODULE_PERMISSIONS[role][module][action];
}

/** Profitability is visible only to Owner and Admin — docs/07 + 10 R09. */
export function canAccessProfitability(role: UserRole): boolean {
  return canAccessModule(role, "profitability", "read");
}

/** Revenue on client records — Owner and Admin only (docs/10 R09). */
export function canViewRevenue(role: UserRole): boolean {
  return role === "owner" || role === "admin";
}

/** Settings access — delegated to authorization permissions. */
export function canAccessSettings(role: UserRole): boolean {
  return hasPermission(resolveAuthorizationRole(role), "settings.read");
}

/** Organization management — Owner only. */
export function canManageOrganization(role: UserRole): boolean {
  return role === "owner";
}

/** User management — delegated to authorization permissions. */
export function canInviteUsers(role: UserRole): boolean {
  return hasPermission(resolveAuthorizationRole(role), "users.write");
}

export function canChangeRoles(role: UserRole): boolean {
  return role === "owner";
}

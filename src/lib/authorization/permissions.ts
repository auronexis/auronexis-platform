import type { UserRole } from "@/types/database";
import { AuthorizationError } from "@/lib/rbac/guards";

/** Canonical authorization roles — Sprint 6 RBAC foundation. */
export type Role = "owner" | "admin" | "manager" | "analyst" | "member" | "readonly";

export const ROLES: readonly Role[] = [
  "owner",
  "admin",
  "manager",
  "analyst",
  "member",
  "readonly",
] as const;

export type Permission =
  | "clients.read"
  | "clients.write"
  | "settings.read"
  | "settings.write"
  | "users.read"
  | "users.write"
  | "sla.read"
  | "sla.write"
  | "reports.read"
  | "reports.write"
  | "activity.read"
  | "risks.read"
  | "risks.write"
  | "customer_success.read"
  | "customer_success.write"
  | "customer_success.assign"
  | "customer_success.complete"
  | "customer_success.manage";

const ALL_PERMISSIONS: readonly Permission[] = [
  "clients.read",
  "clients.write",
  "settings.read",
  "settings.write",
  "users.read",
  "users.write",
  "sla.read",
  "sla.write",
  "reports.read",
  "reports.write",
  "activity.read",
  "risks.read",
  "risks.write",
  "customer_success.read",
  "customer_success.write",
  "customer_success.assign",
  "customer_success.complete",
  "customer_success.manage",
] as const;

/**
 * Maps stored `users.role` values to authorization roles.
 * Legacy DB roles: owner, admin, staff, viewer.
 */
const LEGACY_USER_ROLE_MAP: Record<UserRole, Role> = {
  owner: "owner",
  admin: "admin",
  staff: "analyst",
  viewer: "readonly",
};

/** Sprint 6 role → permission matrix. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  manager: [
    "clients.read",
    "clients.write",
    "sla.read",
    "sla.write",
    "reports.read",
    "reports.write",
    "activity.read",
    "risks.read",
    "risks.write",
    "settings.read",
    "customer_success.read",
    "customer_success.write",
    "customer_success.assign",
    "customer_success.complete",
  ],
  analyst: [
    "clients.read",
    "sla.read",
    "reports.read",
    "reports.write",
    "activity.read",
    "risks.read",
    "risks.write",
    "customer_success.read",
    "customer_success.complete",
  ],
  member: [
    "clients.read",
    "sla.read",
    "reports.read",
    "activity.read",
    "risks.read",
    "customer_success.read",
  ],
  readonly: [
    "clients.read",
    "sla.read",
    "reports.read",
    "activity.read",
    "risks.read",
    "customer_success.read",
  ],
};

const PERMISSION_SET_BY_ROLE: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set(ROLE_PERMISSIONS.owner),
  admin: new Set(ROLE_PERMISSIONS.admin),
  manager: new Set(ROLE_PERMISSIONS.manager),
  analyst: new Set(ROLE_PERMISSIONS.analyst),
  member: new Set(ROLE_PERMISSIONS.member),
  readonly: new Set(ROLE_PERMISSIONS.readonly),
};

/** Normalize a stored or canonical role to an authorization role. */
export function resolveAuthorizationRole(role: UserRole | Role): Role {
  if (role in LEGACY_USER_ROLE_MAP) {
    return LEGACY_USER_ROLE_MAP[role as UserRole];
  }

  return role as Role;
}

export function hasPermission(role: UserRole | Role, permission: Permission): boolean {
  const resolvedRole = resolveAuthorizationRole(role);
  return PERMISSION_SET_BY_ROLE[resolvedRole].has(permission);
}

export function hasAnyPermission(role: UserRole | Role, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole | Role, permissions: readonly Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function assertPermission(
  role: UserRole | Role,
  permission: Permission,
  message = "You do not have permission to perform this action.",
): void {
  if (!hasPermission(role, permission)) {
    throw new AuthorizationError(message);
  }
}

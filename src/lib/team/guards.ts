import type { InviteRole, TeamMemberView } from "@/lib/team/types";
import {
  canChangeRoles,
  hasMinimumRole,
  ROLE_HIERARCHY,
} from "@/lib/rbac/permissions";
import { sessionHasPermission } from "@/lib/authorization/guards";
import type { SessionContext } from "@/lib/tenancy/context";
import type { UserRole } from "@/types/database";

export function canViewTeam(session: SessionContext): boolean {
  return sessionHasPermission(session, "users.read");
}

export function canInviteTeamMembers(session: SessionContext): boolean {
  return sessionHasPermission(session, "users.write");
}

export function canManageOrganizationSettings(session: SessionContext): boolean {
  return sessionHasPermission(session, "settings.write");
}

export function canManageSlaPolicies(session: SessionContext): boolean {
  return sessionHasPermission(session, "sla.write");
}

export function canViewSlaPolicies(session: SessionContext): boolean {
  return sessionHasPermission(session, "sla.read");
}

export function getInvitableRoles(session: SessionContext): InviteRole[] {
  if (session.role === "owner") {
    return ["admin", "staff", "viewer"];
  }

  if (session.role === "admin") {
    return ["staff", "viewer"];
  }

  return [];
}

export function canManageTeamMember(
  session: SessionContext,
  target: Pick<TeamMemberView, "role" | "id">,
): boolean {
  if (session.user.id === target.id) {
    return false;
  }

  if (session.role === "owner") {
    return true;
  }

  if (session.role === "admin") {
    return target.role === "staff" || target.role === "viewer";
  }

  return false;
}

export function canAssignRole(session: SessionContext, role: UserRole): boolean {
  if (session.role === "owner") {
    return role !== "owner" || canChangeRoles(session.role);
  }

  if (session.role === "admin") {
    return role === "staff" || role === "viewer";
  }

  return false;
}

export function getAssignableRoles(session: SessionContext): UserRole[] {
  if (session.role === "owner") {
    return ["owner", "admin", "staff", "viewer"];
  }

  if (session.role === "admin") {
    return ["staff", "viewer"];
  }

  return [];
}

export function isRoleDowngrade(current: UserRole, next: UserRole): boolean {
  return ROLE_HIERARCHY[next] < ROLE_HIERARCHY[current];
}

export function isRoleUpgrade(current: UserRole, next: UserRole): boolean {
  return ROLE_HIERARCHY[next] > ROLE_HIERARCHY[current];
}

export function canAdminManageTargetRole(targetRole: UserRole): boolean {
  return targetRole === "staff" || targetRole === "viewer";
}

export function hasMinimumRoleForTarget(actor: UserRole, target: UserRole): boolean {
  return hasMinimumRole(actor, target);
}

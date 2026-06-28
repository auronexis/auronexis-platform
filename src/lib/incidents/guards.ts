import { canAccessModule } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";
import type { Incident } from "@/types/database";

/** Owner/Admin may resolve or archive incidents. */
export function canManageIncidentLifecycle(session: SessionContext): boolean {
  return canAccessModule(session.role, "incidents", "delete");
}

/** Whether the current user may edit a specific incident. */
export function canEditIncident(
  session: SessionContext,
  incident: Pick<Incident, "assigned_user_id">,
): boolean {
  if (!canAccessModule(session.role, "incidents", "update")) {
    return false;
  }

  if (session.role === "staff") {
    return incident.assigned_user_id === session.user.id;
  }

  return session.role === "owner" || session.role === "admin";
}

/** Whether the current user may create incidents. */
export function canCreateIncident(session: SessionContext): boolean {
  return canAccessModule(session.role, "incidents", "create");
}

import { sessionHasPermission } from "@/lib/authorization/guards";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientRiskView } from "@/lib/risks/types";

export function canCreateRisk(session: SessionContext): boolean {
  return sessionHasPermission(session, "risks.write");
}

export function canEditRisk(
  session: SessionContext,
  risk: Pick<ClientRiskView, "owner_user_id">,
): boolean {
  if (!sessionHasPermission(session, "risks.write")) {
    return false;
  }

  if (session.role === "staff" && risk.owner_user_id) {
    return risk.owner_user_id === session.user.id;
  }

  return true;
}

export function canManageRiskLifecycle(session: SessionContext): boolean {
  return sessionHasPermission(session, "risks.write");
}

export function canDeleteRisk(session: SessionContext): boolean {
  return sessionHasPermission(session, "risks.write") && ["owner", "admin"].includes(session.role);
}

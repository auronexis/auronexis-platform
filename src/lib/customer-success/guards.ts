import { sessionHasPermission } from "@/lib/authorization/guards";
import type { Permission } from "@/lib/authorization/permissions";
import type { SessionContext } from "@/lib/tenancy/context";

export function canReadCustomerSuccess(session: SessionContext): boolean {
  return sessionHasPermission(session, "customer_success.read");
}

export function canWriteCustomerSuccess(session: SessionContext): boolean {
  return sessionHasPermission(session, "customer_success.write");
}

export function canAssignCustomerSuccess(session: SessionContext): boolean {
  return sessionHasPermission(session, "customer_success.assign");
}

export function canCompleteCustomerSuccess(session: SessionContext): boolean {
  return sessionHasPermission(session, "customer_success.complete");
}

export function canManageCustomerSuccess(session: SessionContext): boolean {
  return sessionHasPermission(session, "customer_success.manage");
}

export function hasPlaybookPermission(
  session: SessionContext,
  permissions: string[],
): boolean {
  if (permissions.length === 0) {
    return canReadCustomerSuccess(session);
  }
  return permissions.every((p) =>
    sessionHasPermission(session, p as Permission),
  );
}

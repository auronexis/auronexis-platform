import { canAccessModule } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";
import type { Report } from "@/types/database";

/** Owner/Admin may publish, mark sent, or archive reports. */
export function canManageReportLifecycle(session: SessionContext): boolean {
  return canAccessModule(session.role, "reports", "delete");
}

/** Owner/Admin may publish a ready report to the client portal. */
export function canPublishReport(session: SessionContext): boolean {
  return session.role === "owner" || session.role === "admin";
}

/** Send Email is only available for published reports. */
export function canSendReportEmailForStatus(
  status: Report["status"],
): boolean {
  return status === "published";
}

/** Whether the current user may edit a specific report. */
export function canEditReport(
  session: SessionContext,
  report: Pick<Report, "assigned_user_id">,
): boolean {
  if (!canAccessModule(session.role, "reports", "update")) {
    return false;
  }

  if (session.role === "staff") {
    return report.assigned_user_id === session.user.id;
  }

  return session.role === "owner" || session.role === "admin";
}

/** Whether the current user may create reports. */
export function canCreateReport(session: SessionContext): boolean {
  return canAccessModule(session.role, "reports", "create");
}

/** Whether the current user may export a report as PDF. */
export function canExportReport(
  session: SessionContext,
  report: Pick<Report, "organization_id">,
): boolean {
  if (!canAccessModule(session.role, "reports", "read")) {
    return false;
  }

  return report.organization_id === session.organization.id;
}

/** Owner/Admin may send reports by email. */
export function canSendReportEmail(session: SessionContext): boolean {
  return session.role === "owner" || session.role === "admin";
}

/** All org members with reports read access may view email delivery history. */
export function canViewReportEmailHistory(session: SessionContext): boolean {
  return canAccessModule(session.role, "reports", "read");
}

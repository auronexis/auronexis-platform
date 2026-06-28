import type { UserRole } from "@/types/database";
import {
  canAccessModule,
  canAccessProfitability,
  canAccessSettings,
  canInviteUsers,
  canManageOrganization,
  canViewRevenue,
} from "@/lib/rbac/permissions";

/** Human-readable workspace permissions for the profile page (display only). */
export function getPermissionsSummary(role: UserRole): string[] {
  const items: string[] = [];

  if (canManageOrganization(role)) {
    items.push("Full organization ownership and workspace configuration");
  } else if (canAccessSettings(role)) {
    items.push("Limited workspace settings and configuration access");
  }

  if (canAccessModule(role, "clients", "create")) {
    items.push("Create and manage client records");
  } else if (canAccessModule(role, "clients", "read")) {
    items.push("View client records");
  }

  if (canAccessModule(role, "risks", "create") || canAccessModule(role, "incidents", "create")) {
    items.push("Create and update risks and incidents");
  } else if (
    canAccessModule(role, "risks", "read") ||
    canAccessModule(role, "incidents", "read")
  ) {
    items.push("View risks and incidents");
  }

  if (canAccessModule(role, "reports", "create")) {
    items.push("Draft and publish client reports");
  } else if (canAccessModule(role, "reports", "read")) {
    items.push("View client reports");
  }

  if (canAccessProfitability(role)) {
    items.push(
      canViewRevenue(role)
        ? "Access profitability and client revenue data"
        : "View profitability insights",
    );
  }

  if (canInviteUsers(role)) {
    items.push("Invite and manage workspace members");
  } else if (canAccessModule(role, "team", "read")) {
    items.push("View workspace member list");
  }

  if (canAccessModule(role, "activity", "read")) {
    items.push("View organization activity history");
  }

  if (role === "viewer") {
    return ["Read-only access across assigned operational modules"];
  }

  return items.length > 0 ? items : ["Standard workspace access for your role"];
}

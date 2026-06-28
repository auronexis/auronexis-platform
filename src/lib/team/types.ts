import type { InviteRole, TeamInvitation, UserRole } from "@/types/database";

export type { InviteRole };

export type TeamMemberView = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_disabled: boolean;
  created_at: string;
};

export type TeamInvitationView = TeamInvitation;

export const INVITE_ROLES: InviteRole[] = ["admin", "staff", "viewer"];

export const INVITE_ROLE_LABELS: Record<InviteRole, string> = {
  admin: "Admin",
  staff: "Staff",
  viewer: "Viewer",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
  viewer: "Viewer",
};

export function formatTeamDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function buildInviteUrl(token: string, appUrl: string): string {
  return `${appUrl}/invite/${token}`;
}

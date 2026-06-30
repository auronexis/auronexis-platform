import type { Metadata } from "next";
import Link from "next/link";
import { SeatUsageCard } from "@/components/seats/seat-usage-card";
import { InviteTeamForm } from "@/components/team/invite-team-form";
import { PendingInvitations } from "@/components/team/pending-invitations";
import { TeamMemberList } from "@/components/team/team-member-list";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { canManagePortalUsers } from "@/lib/client-portal/guards";
import { canAccessSettings } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import {
  canInviteTeamMembers,
  getInvitableRoles,
} from "@/lib/team/guards";
import { listPendingInvitations, listTeamMembers } from "@/lib/team/queries";
import { getInviteSeatCheckForSession, getOrganizationSeatUsageFromSession } from "@/lib/seats";

export const metadata: Metadata = {
  title: "Team",
};

export default async function TeamSettingsPage() {
  await requireModuleAccess("team");
  const session = await requireSession();
  const [members, invitations, seatUsage, inviteSeatCheck] = await Promise.all([
    listTeamMembers(session),
    canInviteTeamMembers(session) ? listPendingInvitations(session) : Promise.resolve([]),
    getOrganizationSeatUsageFromSession(session),
    canInviteTeamMembers(session)
      ? getInviteSeatCheckForSession(session)
      : Promise.resolve({ allowed: true as const }),
  ]);

  const canInvite = canInviteTeamMembers(session);
  const canManagePortal = canManagePortalUsers(session);

  return (
    <>
      <PageHeader
        module="settings"
        title="Workspace Members"
        description="Manage members, roles, and invitations for your organization."
      />
      <div className="mb-4 text-sm text-muted">
        {canAccessSettings(session.role) ? (
          <>
            <Link href="/settings" className="font-medium text-accent-blue hover:underline">
              Settings
            </Link>
            <span className="mx-2">/</span>
          </>
        ) : null}
        <span>Team</span>
      </div>

      <div className="space-y-6">
        <SeatUsageCard usage={seatUsage} showLinks={false} />
        {canManagePortal ? (
          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Client portal access</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Create and disable client portal users from each client profile. Portal login:{" "}
              <span className="font-medium text-blue-600 dark:text-blue-300">/client-portal/login</span>
            </p>
            <Link
              href="/clients"
              className="mt-3 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Manage from clients
            </Link>
          </div>
        ) : null}
        <TeamMemberList members={members} session={session} />
        {canInvite ? <PendingInvitations invitations={invitations} /> : null}
        {canInvite ? (
          <InviteTeamForm
            invitableRoles={getInvitableRoles(session)}
            seatBlocked={!inviteSeatCheck.allowed}
            seatBlockedMessage={
              inviteSeatCheck.allowed ? undefined : inviteSeatCheck.message
            }
          />
        ) : null}
      </div>
    </>
  );
}

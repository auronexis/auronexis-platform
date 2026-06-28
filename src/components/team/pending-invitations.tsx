import {
  buildInviteUrl,
  formatTeamDate,
  INVITE_ROLE_LABELS,
  type TeamInvitationView,
} from "@/lib/team/types";
import { getAppUrl } from "@/lib/env";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { linkText } from "@/lib/ui/tokens";

type PendingInvitationsProps = {
  invitations: TeamInvitationView[];
};

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
  const appUrl = getAppUrl();

  return (
    <PageSurface>
      <PageSurfaceHeading
        title="Pending invitations"
        description="Share invite links with teammates before they expire."
      />
      {invitations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-foreground">No pending invitations</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Invited teammates will appear here until they accept and join your workspace.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/70">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">{invitation.email}</p>
                  <p className="text-sm text-muted">
                    {INVITE_ROLE_LABELS[invitation.role]} · Expires{" "}
                    {formatTeamDate(invitation.expires_at)}
                  </p>
                </div>
                <p className="break-all text-xs text-muted">
                  <span className="font-medium text-foreground">Invite link: </span>
                  <span className={linkText}>{buildInviteUrl(invitation.token, appUrl)}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageSurface>
  );
}

import { TeamMemberActions } from "@/components/team/team-member-actions";
import { TeamMemberStatusBadge } from "@/components/team/team-member-status-badge";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableEmpty,
  AuroraTableHead,
  AuroraTableHeaderCell,
  AuroraTableRow,
} from "@/components/ui/table";
import {
  canManageTeamMember,
  getAssignableRoles,
} from "@/lib/team/guards";
import { formatTeamDate, USER_ROLE_LABELS, type TeamMemberView } from "@/lib/team/types";
import type { SessionContext } from "@/lib/tenancy/context";

type TeamMemberListProps = {
  members: TeamMemberView[];
  session: SessionContext;
};

export function TeamMemberList({ members, session }: TeamMemberListProps) {
  const assignableRoles = getAssignableRoles(session);

  if (members.length === 0) {
    return (
      <AuroraTableEmpty
        title="No workspace members"
        description="Invite colleagues to collaborate on operational monitoring and client delivery."
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Name</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Email</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Role</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Joined</AuroraTableHeaderCell>
            <AuroraTableHeaderCell className="text-right">Actions</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {members.map((member) => (
            <AuroraTableRow key={member.id} interactive={false}>
              <AuroraTableCell className="whitespace-nowrap font-semibold">
                {member.full_name}
                {member.id === session.user.id ? (
                  <span className="ml-2 text-xs font-normal text-muted">(you)</span>
                ) : null}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {member.email}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {USER_ROLE_LABELS[member.role]}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <TeamMemberStatusBadge isDisabled={member.is_disabled} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatTeamDate(member.created_at)}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-right">
                <TeamMemberActions
                  member={member}
                  assignableRoles={assignableRoles}
                  canManage={canManageTeamMember(session, member)}
                />
              </AuroraTableCell>
            </AuroraTableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}

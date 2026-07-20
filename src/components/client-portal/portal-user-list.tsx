import { DisablePortalUserButton } from "@/components/client-portal/disable-portal-user-button";
import { StatusBadge } from "@/components/ui/badge";
import type { ClientPortalUser } from "@/types/database";

type PortalUserListProps = {
  users: ClientPortalUser[];
};

export function PortalUserList({ users }: PortalUserListProps) {
  if (users.length === 0) {
    return <p className="text-sm text-muted">No portal users for this client yet.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {users.map((user) => (
        <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-medium text-foreground">{user.full_name}</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge tone={user.is_active ? "success" : "muted"}>
              {user.is_active ? "Active" : "Disabled"}
            </StatusBadge>
            {user.is_active ? <DisablePortalUserButton portalUserId={user.id} /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

import { DisablePortalUserButton } from "@/components/client-portal/disable-portal-user-button";
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
            <p className="font-medium text-navy-950">{user.full_name}</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={
                user.is_active
                  ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
                  : "inline-flex rounded-full bg-muted/10 px-2.5 py-0.5 text-xs font-medium text-muted"
              }
            >
              {user.is_active ? "Active" : "Disabled"}
            </span>
            {user.is_active ? <DisablePortalUserButton portalUserId={user.id} /> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

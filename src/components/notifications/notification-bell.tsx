import type { SessionContext } from "@/lib/tenancy/context";
import { NotificationBellClient } from "@/components/notifications/notification-bell-client";

type NotificationBellProps = {
  session: SessionContext;
  unreadCount: number;
  hidden?: boolean;
};

/** Header notification bell with unread badge and recent dropdown panel. */
export async function NotificationBell({
  session,
  unreadCount,
  hidden = false,
}: NotificationBellProps) {
  if (hidden) {
    return null;
  }

  const { listNotifications } = await import("@/lib/notifications/queries");
  const recent = await listNotifications(session, { limit: 5 });

  return <NotificationBellClient unreadCount={unreadCount} recent={recent} />;
}

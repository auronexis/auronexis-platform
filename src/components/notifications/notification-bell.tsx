import Link from "next/link";

import type { SessionContext } from "@/lib/tenancy/context";
import { cn } from "@/lib/utils/cn";
import { topbarIconButton } from "@/lib/ui/motion";
import { linkText } from "@/lib/ui/tokens";

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
  const { NotificationList } = await import("@/components/notifications/notification-list");

  const recent = await listNotifications(session, { limit: 5 });

  return (
    <div className="group relative">
      <Link
        href="/notifications"
        className={cn(topbarIconButton, "relative cursor-pointer")}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Link>

      <div
        className={cn(
          "pointer-events-none invisible absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-border bg-surface opacity-0 shadow-lg",
          "translate-y-1.5 scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
          "group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <Link href="/notifications" className={cn(linkText, "text-xs")}>
            View all
          </Link>
        </div>
        <div className="max-h-80 overflow-y-auto p-3">
          <NotificationList
            notifications={recent}
            compact
            emptyMessage="You're all caught up."
          />
        </div>
      </div>
    </div>
  );
}

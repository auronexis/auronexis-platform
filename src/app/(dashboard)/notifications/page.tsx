import type { Metadata } from "next";
import Link from "next/link";
import { MarkAllNotificationsReadButton } from "@/components/notifications/mark-all-read-button";
import { NotificationList } from "@/components/notifications/notification-list";
import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { PageHeader } from "@/components/layout/page-header";
import { listNotifications, getUnreadNotificationCount } from "@/lib/notifications/queries";
import { requireSession } from "@/lib/auth/session";
import { linkText } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const session = await requireSession();
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(session, { limit: 100 }),
    getUnreadNotificationCount(session),
  ]);

  return (
    <PlanFeatureGate feature="notifications">
      <PageHeader
        module="notifications"
        title="Notifications"
        description="Internal alerts for operational events across your organization."
        action={
          unreadCount > 0 ? (
            <MarkAllNotificationsReadButton />
          ) : undefined
        }
      />

      {unreadCount > 0 ? (
        <p className="mb-4 text-sm text-muted">
          {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
        </p>
      ) : null}

      <div className="rounded-2xl border border-border/80 bg-gradient-to-b from-surface via-surface to-muted/5 p-6 shadow-sm">
        <NotificationList notifications={notifications} />
      </div>

      <p className="mt-4 text-sm text-muted">
        <Link href="/dashboard" className={linkText}>
          Back to dashboard
        </Link>
      </p>
    </PlanFeatureGate>
  );
}

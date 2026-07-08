"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { markNotificationRead } from "@/lib/notifications/actions";
import {
  formatNotificationTimestamp,
  getNotificationHref,
  NOTIFICATION_TYPE_LABELS,
} from "@/lib/notifications/types";
import { focusRing, linkText, transitionInteractive } from "@/lib/ui/tokens";
import type { Notification } from "@/types/database";
import { cn } from "@/lib/utils/cn";

type NotificationListProps = {
  notifications: Notification[];
  compact?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
};

export function NotificationList({
  notifications,
  compact = false,
  emptyMessage = "You're all caught up",
  emptyDescription = "New operational alerts will appear here when risks, incidents, or reports need attention.",
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={emptyMessage}
        description={emptyDescription}
        className="border-solid bg-transparent shadow-none"
      />
    );
  }

  return (
    <ul className={compact ? "space-y-2" : "divide-y divide-border/70"}>
      {notifications.map((notification) => (
        <NotificationListItem
          key={notification.id}
          notification={notification}
          compact={compact}
        />
      ))}
    </ul>
  );
}

type NotificationListItemProps = {
  notification: Notification;
  compact?: boolean;
};

function NotificationListItem({ notification, compact }: NotificationListItemProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const isUnread = !notification.read_at;
  const href = getNotificationHref(notification.entity_type, notification.entity_id);

  function handleMarkRead() {
    if (!isUnread || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await markNotificationRead(notification.id);
      if (result.error) {
        toast({ title: result.error, variant: "error" });
      }
    });
  }

  const content = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p
          className={cn(
            "text-sm",
            isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90",
          )}
        >
          {notification.title}
        </p>
        <span className="rounded-full border border-border bg-muted/10 px-2 py-0.5 text-xs font-semibold text-muted">
          {NOTIFICATION_TYPE_LABELS[notification.type]}
        </span>
        {isUnread ? (
          <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
        ) : null}
      </div>
      {notification.message ? (
        <p className="mt-1 text-sm text-muted">{notification.message}</p>
      ) : null}
      <p className="mt-1 text-xs text-muted">
        {formatNotificationTimestamp(notification.created_at)}
      </p>
    </div>
  );

  return (
    <li
      className={cn(
        compact ? "rounded-xl border px-3 py-2.5" : "py-4 first:pt-0",
        transitionInteractive,
        isUnread
          ? compact
            ? "border-primary/20 bg-primary/5"
            : "bg-primary/[0.03] -mx-2 rounded-xl px-2"
          : compact
            ? "border-border bg-surface hover:border-border-strong hover:bg-muted/5"
            : "hover:bg-muted/5",
        focusRing,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {href ? (
          <Link
            href={href}
            className={cn(linkText, "min-w-0 flex-1 no-underline hover:underline")}
            onClick={handleMarkRead}
          >
            {content}
          </Link>
        ) : (
          content
        )}
        {isUnread && !compact ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            loading={isPending}
            loadingText="Updating…"
            onClick={handleMarkRead}
            className="shrink-0 text-xs"
          >
            Mark read
          </Button>
        ) : null}
      </div>
    </li>
  );
}

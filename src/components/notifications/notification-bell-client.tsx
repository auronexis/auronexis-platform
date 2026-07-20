"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/types/database";
import { cn } from "@/lib/utils/cn";
import { topbarIconButton } from "@/lib/ui/motion";
import { linkText } from "@/lib/ui/tokens";
import { restoreFocus } from "@/lib/a11y/focus";

type NotificationBellClientProps = {
  unreadCount: number;
  recent: Notification[];
};

/** Interactive notification preview — keyboard, touch, and hover accessible. */
export function NotificationBellClient({ unreadCount, recent }: NotificationBellClientProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        restoreFocus(triggerRef.current);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="group relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(topbarIconButton, "relative cursor-pointer")}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
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
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-danger/30 bg-danger px-1 text-[10px] font-bold leading-none text-danger-foreground shadow-sm"
            aria-hidden
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      <div
        id={panelId}
        role="region"
        aria-label="Recent notifications"
        hidden={!open}
        className={cn(
          "absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-border bg-surface shadow-lg",
          "translate-y-0 scale-100 opacity-100 transition-all duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
          !open && "pointer-events-none invisible translate-y-1.5 scale-[0.98] opacity-0",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          <Link
            href="/notifications"
            className={cn(linkText, "text-xs")}
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
        <div className="max-h-80 overflow-y-auto p-3">
          <NotificationList
            notifications={recent}
            compact
            emptyMessage="You're all caught up"
            emptyDescription="New alerts for risks, incidents, and reports will appear here."
          />
        </div>
      </div>
    </div>
  );
}

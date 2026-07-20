"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CreditCard, LogOut, Settings, UserRound } from "lucide-react";
import { AvatarFallback } from "@/components/branding/avatar-fallback";
import { SignOutPendingSplash } from "@/components/branding/brand-splash";
import { Icon } from "@/components/ui/icon";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils/cn";
import { motionDropdownEnter } from "@/lib/ui/motion";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";
import { handleMenuKeyNavigation, restoreFocus } from "@/lib/a11y/focus";

type UserMenuProps = {
  userName: string;
  userRole: string;
  showSettings: boolean;
};

type MenuItemProps = {
  href?: string;
  label: string;
  icon: typeof UserRound;
  onClick?: () => void;
  disabled?: boolean;
};

function MenuItem({ href, label, icon, onClick, disabled }: MenuItemProps) {
  const content = (
    <>
      <Icon icon={icon} size="sm" className="text-muted" />
      <span>{label}</span>
    </>
  );

  const className = cn(
    "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm",
    transitionInteractive,
    disabled
      ? "cursor-not-allowed text-muted opacity-60"
      : "text-foreground hover:bg-muted/5",
    !disabled && focusRing,
  );

  if (disabled) {
    return (
      <button type="button" role="menuitem" disabled className={className}>
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} role="menuitem" className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

export function UserMenu({ userName, userRole, showSettings }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!menuRef.current) {
        return;
      }
      handleMenuKeyNavigation(event, menuRef.current, () => {
        setOpen(false);
        restoreFocus(triggerRef.current);
      });
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex max-w-[220px] cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 text-left shadow-xs",
          transitionInteractive,
          "hover:border-border-strong hover:bg-muted/5 hover:shadow-sm hover:scale-[1.01]",
          "active:scale-[0.98]",
          focusRing,
        )}
        aria-label={`Open account menu for ${userName}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <AvatarFallback name={userName} size="sm" />
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium text-foreground">{userName}</span>
          <span className="block truncate text-xs capitalize text-muted">{userRole}</span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg",
            motionDropdownEnter,
          )}
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            <p className="truncate text-xs capitalize text-muted">{userRole}</p>
          </div>

          <MenuItem
            href="/profile"
            label="Profile"
            icon={UserRound}
            onClick={() => setOpen(false)}
          />

          {showSettings ? (
            <>
              <MenuItem
                href="/settings"
                label="Settings"
                icon={Settings}
                onClick={() => setOpen(false)}
              />
              <MenuItem
                href="/settings/billing"
                label="Billing"
                icon={CreditCard}
                onClick={() => setOpen(false)}
              />
            </>
          ) : null}

          <div className="my-1 border-t border-border" />

          <form
            action={signOut}
            onSubmit={() => setOpen(false)}
          >
            <SignOutPendingSplash />
            <button
              type="submit"
              role="menuitem"
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-foreground",
                transitionInteractive,
                "hover:bg-muted/5",
                focusRing,
              )}
            >
              <Icon icon={LogOut} size="sm" className="text-muted" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

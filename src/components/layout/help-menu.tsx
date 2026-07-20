"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CircleHelp,
  ExternalLink,
  LifeBuoy,
  Mail,
  Rocket,
  Shield,
  Signal,
} from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { AdaptiveBrandLogo } from "@/components/branding/brand-logo";
import { getPlatformBrandingDefaults } from "@/lib/branding/platform-defaults";
import { HELP_LINKS } from "@/lib/company/contact";
import { cn } from "@/lib/utils/cn";
import { motionDropdownEnter } from "@/lib/ui/motion";
import { focusRing, iconButtonSurface } from "@/lib/ui/tokens";
import { handleMenuKeyNavigation, restoreFocus } from "@/lib/a11y/focus";

type HelpLinkItem = {
  label: string;
  href: string;
  icon: typeof BookOpen;
  external?: boolean;
};

const HELP_ITEMS: HelpLinkItem[] = [
  { label: "Documentation", href: HELP_LINKS.documentation, icon: BookOpen },
  { label: "Status", href: HELP_LINKS.statusPage, icon: Signal },
  { label: "Support", href: HELP_LINKS.support, icon: LifeBuoy },
  { label: "Security", href: HELP_LINKS.security, icon: Shield },
  { label: "Pilot Program", href: HELP_LINKS.pilotProgram, icon: Rocket },
  { label: "Contact support", href: "/settings/support", icon: Mail },
  { label: "Help Center", href: HELP_LINKS.helpCenter, icon: CircleHelp },
];

function HelpMenuLink({ item, onSelect }: { item: HelpLinkItem; onSelect: () => void }) {
  const className = cn(
    "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted/10",
    focusRing,
  );

  if (item.external || item.href.startsWith("mailto:")) {
    return (
      <a href={item.href} role="menuitem" className={className} onClick={onSelect}>
        <Icon icon={item.icon} size="sm" className="text-muted" />
        {item.label}
        <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted" aria-hidden />
      </a>
    );
  }

  return (
    <Link href={item.href} role="menuitem" className={className} onClick={onSelect}>
      <Icon icon={item.icon} size="sm" className="text-muted" />
      {item.label}
    </Link>
  );
}

export function HelpMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const platformBranding = getPlatformBrandingDefaults();

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
        className={iconButtonSurface}
        aria-label="Help"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon icon={CircleHelp} size="sm" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-xl border border-border bg-surface shadow-lg",
            motionDropdownEnter,
          )}
        >
          <div className="border-b border-border px-3 py-3">
            <AdaptiveBrandLogo
              branding={platformBranding}
              layout="horizontal"
              className="h-10 w-auto"
            />
          </div>
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Help
          </div>
          {HELP_ITEMS.map((item) => (
            <HelpMenuLink key={item.label} item={item} onSelect={() => setOpen(false)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Menu, Settings } from "lucide-react";
import {
  GlobalSearchProvider,
  GlobalSearchTrigger,
} from "@/components/layout/global-search";
import { HelpMenu } from "@/components/layout/help-menu";
import { useMobileNav } from "@/components/layout/mobile-nav-context";
import { UserMenu } from "@/components/layout/user-menu";
import { AdaptiveBrandLogo } from "@/components/branding/brand-logo";
import { Icon } from "@/components/ui/icon";
import { getPageTitle } from "@/lib/layout/page-titles";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { cn } from "@/lib/utils/cn";
import { iconButtonSurface } from "@/lib/ui/tokens";

type TopbarProps = {
  organizationName: string;
  userName: string;
  userRole: string;
  showSettings: boolean;
  notifications: ReactNode;
  branding: ResolvedOrganizationBranding;
};

export function Topbar({
  organizationName,
  userName,
  userRole,
  showSettings,
  notifications,
  branding,
}: TopbarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const { toggle: toggleMobileNav } = useMobileNav();

  return (
    <GlobalSearchProvider>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur-sm shadow-xs sm:gap-3 sm:px-4 lg:h-16 lg:gap-4 lg:px-6">
        <button
          type="button"
          className={cn(iconButtonSurface, "lg:hidden")}
          aria-label="Open navigation menu"
          onClick={toggleMobileNav}
        >
          <Icon icon={Menu} size="sm" />
        </button>

        <AdaptiveBrandLogo
          branding={branding}
          layout="horizontal"
          className="h-8 w-auto shrink-0 lg:hidden"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted">{organizationName}</p>
          <p className="truncate text-sm font-semibold tracking-tight text-foreground lg:text-base">
            {pageTitle}
          </p>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <GlobalSearchTrigger className="w-full max-w-xl" />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <GlobalSearchTrigger compact />

          {notifications}

          <HelpMenu />

          {showSettings ? (
            <Link href="/settings" className={iconButtonSurface} aria-label="Settings">
              <Icon icon={Settings} size="sm" />
            </Link>
          ) : null}

          <UserMenu userName={userName} userRole={userRole} showSettings={showSettings} />
        </div>
      </header>
    </GlobalSearchProvider>
  );
}

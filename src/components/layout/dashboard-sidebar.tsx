"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";
import { useMobileNav } from "@/components/layout/mobile-nav-context";
import { useUserPreferences } from "@/components/profile/user-preferences-provider";
import { sidebarNavScroll } from "@/lib/ui/tokens";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import type { NavItemView } from "@/lib/tenancy/context";
import { cn } from "@/lib/utils/cn";

type DashboardSidebarProps = {
  navItems: NavItemView[];
  organizationName: string;
  branding: ResolvedOrganizationBranding;
};

export function DashboardSidebar({ navItems, organizationName, branding }: DashboardSidebarProps) {
  const { sidebarCollapsed } = useUserPreferences();
  const { open, close } = useMobileNav();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] lg:hidden"
          onClick={close}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full shrink-0 flex-col overflow-hidden border-r text-primary-foreground transition-[width,transform] duration-150 ease-out lg:relative lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-[4.5rem]" : "w-64",
        )}
        style={{
          backgroundColor: branding.secondaryColor,
          borderColor: `${branding.secondaryColor}CC`,
        }}
      >
        <div className="shrink-0 border-b border-white/10 px-3 py-3">
          <WorkspaceSwitcher
            branding={branding}
            organizationName={organizationName}
            collapsed={sidebarCollapsed}
          />
        </div>

        <div className={sidebarNavScroll}>
          <SidebarNav items={navItems} collapsed={sidebarCollapsed} onNavigate={close} />
        </div>
      </aside>
    </>
  );
}

type DashboardMainProps = {
  children: React.ReactNode;
};

export function DashboardMain({ children }: DashboardMainProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="dashboard-main min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8"
    >
      {children}
    </main>
  );
}

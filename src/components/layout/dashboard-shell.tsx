import { PageTransition } from "@/components/layout/page-transition";
import { DashboardMain, DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { SiteFooter } from "@/components/layout/site-footer";
import { Topbar } from "@/components/layout/topbar";
import { SkipLink } from "@/components/ui/skip-link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { pageContainer } from "@/lib/ui/tokens";
import { canAccessSettings } from "@/lib/rbac/permissions";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import type { NavItemView, SessionContext } from "@/lib/tenancy/context";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils/cn";

type DashboardShellProps = {
  children: React.ReactNode;
  navItems: NavItemView[];
  organizationName: string;
  userName: string;
  userRole: string;
  session: SessionContext;
  unreadNotificationCount: number;
  showNotifications: boolean;
  branding: ResolvedOrganizationBranding;
};

/** Primary application shell — Operations Command Center layout. */
export function DashboardShell({
  children,
  navItems,
  organizationName,
  userName,
  userRole,
  session,
  unreadNotificationCount,
  showNotifications,
  branding,
}: DashboardShellProps) {
  const showSettings = canAccessSettings(userRole as UserRole);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SkipLink />
      <DashboardSidebar
        navItems={navItems}
        organizationName={organizationName}
        branding={branding}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          organizationName={organizationName}
          userName={userName}
          userRole={userRole}
          showSettings={showSettings}
          notifications={
            <NotificationBell
              session={session}
              unreadCount={unreadNotificationCount}
              hidden={!showNotifications}
            />
          }
          branding={branding}
        />
        <DashboardMain>
          <PageTransition className={cn(pageContainer, "flex min-h-full flex-col")}>
            {children}
            <SiteFooter className="mt-10" />
          </PageTransition>
        </DashboardMain>
      </div>
    </div>
  );
}

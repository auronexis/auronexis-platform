import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getClientPortalSession } from "@/lib/client-portal/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { MobileNavProvider } from "@/components/layout/mobile-nav-context";
import { UserPreferencesProvider } from "@/components/profile/user-preferences-provider";
import { ToastProvider } from "@/components/ui/toast";
import { getOrganizationBranding } from "@/lib/branding/queries";
import { getCurrentPlan } from "@/lib/plans/queries";
import { canUseFeature } from "@/lib/plans/guards";
import { getNavItemsForRoleAndPlan } from "@/lib/tenancy/context";
import { getUnreadNotificationCount } from "@/lib/notifications/queries";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getSession();

  if (!session) {
    const portalSession = await getClientPortalSession();
    if (portalSession) {
      redirect("/client-portal/dashboard");
    }
    redirect("/login");
  }

  const navItems = getNavItemsForRoleAndPlan(session.role, await getCurrentPlan(session.organization.id));
  const [unreadNotificationCount, branding, notificationsEnabled] = await Promise.all([
    getUnreadNotificationCount(session),
    getOrganizationBranding(session),
    canUseFeature(session.organization.id, "notifications"),
  ]);

  return (
    <UserPreferencesProvider>
      <ToastProvider>
        <MobileNavProvider>
          <WhiteLabelThemeInjector branding={branding} scopeId="dashboard-root" />
          <div id="dashboard-root" className="white-label-scope contents">
            <DashboardShell
            navItems={navItems}
            organizationName={session.organization.name}
            userName={session.user.full_name}
            userRole={session.role}
            session={session}
            unreadNotificationCount={notificationsEnabled ? unreadNotificationCount : 0}
            showNotifications={notificationsEnabled}
            branding={branding}
          >
            {children}
          </DashboardShell>
          </div>
        </MobileNavProvider>
      </ToastProvider>
    </UserPreferencesProvider>
  );
}

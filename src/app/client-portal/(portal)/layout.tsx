import type { Metadata } from "next";
import type { PortalNavItem } from "@/components/client-portal/portal-shell";
import { PortalShell, PORTAL_NAV_ITEMS } from "@/components/client-portal/portal-shell";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPrivateAppMetadata("Client Portal");

type PortalAuthenticatedLayoutProps = {
  children: React.ReactNode;
};

export default async function PortalAuthenticatedLayout({
  children,
}: PortalAuthenticatedLayoutProps) {
  const session = await requireClientPortalSession();
  const branding = await getOrganizationBrandingForOrganization(
    session.organization.id,
    session.organization.name,
  );

  const navItems: PortalNavItem[] = [
    PORTAL_NAV_ITEMS.overview,
    PORTAL_NAV_ITEMS.health,
    PORTAL_NAV_ITEMS.executive,
    PORTAL_NAV_ITEMS.reports,
    PORTAL_NAV_ITEMS.incidents,
    PORTAL_NAV_ITEMS.sla,
    PORTAL_NAV_ITEMS.timeline,
    PORTAL_NAV_ITEMS.contacts,
    PORTAL_NAV_ITEMS.support,
  ];

  return (
    <>
      <WhiteLabelThemeInjector branding={branding} scopeId="portal-root" />
      <div id="portal-root" className="white-label-scope contents">
        <PortalShell
          organizationName={session.organization.name}
          clientName={session.client.name}
          userName={session.portalUser.full_name}
          branding={branding}
          navItems={navItems}
        >
          {children}
        </PortalShell>
      </div>
    </>
  );
}

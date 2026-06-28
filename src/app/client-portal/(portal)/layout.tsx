import {

  AlertTriangle,

  FileText,

  LayoutDashboard,

  Rocket,

  ShieldAlert,

} from "lucide-react";

import type { PortalNavItem } from "@/components/client-portal/portal-shell";
import { PortalShell, PORTAL_NAV_ITEMS } from "@/components/client-portal/portal-shell";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";

import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";

import { requireClientPortalSession } from "@/lib/client-portal/session";

import { getOrganizationPlanContext } from "@/lib/plans/queries";



type PortalAuthenticatedLayoutProps = {

  children: React.ReactNode;

};



export default async function PortalAuthenticatedLayout({

  children,

}: PortalAuthenticatedLayoutProps) {

  const session = await requireClientPortalSession();

  const [branding, plan] = await Promise.all([

    getOrganizationBrandingForOrganization(session.organization.id, session.organization.name),

    getOrganizationPlanContext(session.organization.id),

  ]);



  const navItems: PortalNavItem[] = [

    { ...PORTAL_NAV_ITEMS.dashboard, icon: LayoutDashboard },

    { ...PORTAL_NAV_ITEMS.onboarding, icon: Rocket },

    { ...PORTAL_NAV_ITEMS.reports, icon: FileText },

  ];



  if (plan.features.risks) {

    navItems.push({ ...PORTAL_NAV_ITEMS.risks, icon: AlertTriangle });

  }



  if (plan.features.incidents) {

    navItems.push({ ...PORTAL_NAV_ITEMS.incidents, icon: ShieldAlert });

  }



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

      showSlaFields={plan.features.sla_tracking}

    >

      {children}

    </PortalShell>
      </div>
    </>

  );

}



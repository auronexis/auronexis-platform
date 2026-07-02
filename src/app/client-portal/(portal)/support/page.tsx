import type { Metadata } from "next";
import { PortalSupportCard } from "@/components/client-portal/portal-v3";
import { PortalPageHeader } from "@/components/client-portal/portal-ui";
import { recordPortalActivity } from "@/lib/client-portal/activity";
import { getPortalSupport } from "@/lib/client-portal/portal-support";
import { requireClientPortalSession } from "@/lib/client-portal/session";
import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";

export const metadata: Metadata = {
  title: "Portal Support",
};

export default async function ClientPortalSupportPage() {
  const session = await requireClientPortalSession();
  const branding = await getOrganizationBrandingForOrganization(
    session.organization.id,
    session.organization.name,
  );
  const contacts = await getPortalSupport(session, branding.supportEmail ?? null);

  void recordPortalActivity(session, {
    eventType: "portal.support_viewed",
    title: "Portal support viewed",
  }).catch(() => undefined);

  return (
    <>
      <PortalPageHeader
        title="Support"
        description="Support requests are coming soon."
      />
      <PortalSupportCard support={contacts} />
    </>
  );
}

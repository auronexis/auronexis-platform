import type { Metadata } from "next";
import { PortalEmptyState, PortalPageHeader } from "@/components/client-portal/portal-ui";
import { PortalContactsCard } from "@/components/client-portal/portal-v3";
import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";
import { getPortalContacts } from "@/lib/client-portal/portal-support";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Portal Contacts",
};

export default async function ClientPortalContactsPage() {
  const session = await requireClientPortalSession();
  const branding = await getOrganizationBrandingForOrganization(
    session.organization.id,
    session.organization.name,
  );
  const contacts = await getPortalContacts(session, branding.supportEmail ?? null);

  const hasContacts =
    contacts.contactName ||
    contacts.contactEmail ||
    contacts.accountOwnerName ||
    contacts.supportEmail;

  return (
    <>
      <PortalPageHeader
        title="Contacts"
        description="People and channels connected to your account."
      />

      {!hasContacts ? (
        <PortalEmptyState
          title="No contact details available"
          description="Your agency will add contact information for your account."
        />
      ) : (
        <PortalContactsCard contacts={contacts} />
      )}
    </>
  );
}

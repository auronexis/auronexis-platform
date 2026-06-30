import type { Metadata } from "next";
import { Mail, UserRound } from "lucide-react";
import { PortalCard, PortalEmptyState, PortalPageHeader } from "@/components/client-portal/portal-ui";
import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";
import { getPortalContacts } from "@/lib/client-portal/queries";
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
        <div className="grid gap-5 md:grid-cols-2">
          <PortalCard>
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-base font-semibold text-foreground">Primary contact</h2>
            </div>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Name</dt>
                <dd className="mt-1 text-sm text-foreground">{contacts.contactName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Email</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {contacts.contactEmail ? (
                    <a href={`mailto:${contacts.contactEmail}`} className="text-primary hover:underline">
                      {contacts.contactEmail}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </PortalCard>

          <PortalCard>
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-base font-semibold text-foreground">Account owner</h2>
            </div>
            <p className="mt-4 text-sm text-foreground">
              {contacts.accountOwnerName ?? "Your account manager details will appear here."}
            </p>
          </PortalCard>

          <PortalCard className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-base font-semibold text-foreground">Support</h2>
            </div>
            <p className="mt-4 text-sm text-muted">
              {contacts.supportEmail
                ? `For support inquiries, email ${contacts.supportEmail}.`
                : "Support email will be shared by your agency when available."}
            </p>
          </PortalCard>
        </div>
      )}
    </>
  );
}

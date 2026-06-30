import type { Metadata } from "next";
import { PortalCard, PortalPageHeader } from "@/components/client-portal/portal-ui";
import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";
import { getPortalContacts } from "@/lib/client-portal/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Portal Support",
};

export default async function ClientPortalSupportPage() {
  const session = await requireClientPortalSession();
  const branding = await getOrganizationBrandingForOrganization(
    session.organization.id,
    session.organization.name,
  );
  const contacts = await getPortalContacts(session, branding.supportEmail ?? null);

  return (
    <>
      <PortalPageHeader
        title="Support"
        description="Support requests are coming soon."
      />

      <PortalCard>
        <p className="text-sm leading-relaxed text-muted">
          Support requests are coming soon. You will be able to submit questions and track responses
          directly from this workspace.
        </p>

        {contacts.supportEmail ? (
          <p className="mt-4 text-sm text-foreground">
            In the meantime, contact your agency at{" "}
            <a href={`mailto:${contacts.supportEmail}`} className="font-medium text-primary hover:underline">
              {contacts.supportEmail}
            </a>
            .
          </p>
        ) : null}

        <fieldset disabled className="mt-8 space-y-4 opacity-60">
          <div>
            <label htmlFor="support-subject" className="text-sm font-medium text-foreground">
              Subject
            </label>
            <input
              id="support-subject"
              type="text"
              disabled
              placeholder="Coming soon"
              className="mt-2 w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="support-message" className="text-sm font-medium text-foreground">
              Message
            </label>
            <textarea
              id="support-message"
              disabled
              rows={4}
              placeholder="Support request submission will be enabled in a future release."
              className="mt-2 w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled
            className="rounded-lg bg-primary/50 px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Submit request
          </button>
        </fieldset>
      </PortalCard>
    </>
  );
}

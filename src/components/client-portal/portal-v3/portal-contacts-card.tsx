import { PortalCard } from "@/components/client-portal/portal-ui";
import type { PortalContactsData } from "@/lib/client-portal/types";

type PortalContactsCardProps = {
  contacts: PortalContactsData;
};

export function PortalContactsCard({ contacts }: PortalContactsCardProps) {
  return (
    <PortalCard>
      <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
      <dl className="mt-5 space-y-4 text-sm">
        <div>
          <dt className="text-muted">Primary contact</dt>
          <dd className="mt-1 font-medium text-foreground">{contacts.contactName ?? "—"}</dd>
          {contacts.contactEmail ? (
            <dd className="mt-1 text-muted">
              <a href={`mailto:${contacts.contactEmail}`} className="text-primary hover:underline">
                {contacts.contactEmail}
              </a>
            </dd>
          ) : null}
        </div>
        <div>
          <dt className="text-muted">Account owner</dt>
          <dd className="mt-1 font-medium text-foreground">{contacts.accountOwnerName ?? "—"}</dd>
        </div>
        {contacts.supportEmail ? (
          <div>
            <dt className="text-muted">Support</dt>
            <dd className="mt-1">
              <a href={`mailto:${contacts.supportEmail}`} className="text-primary hover:underline">
                {contacts.supportEmail}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
    </PortalCard>
  );
}

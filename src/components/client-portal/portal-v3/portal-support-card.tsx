import Link from "next/link";
import { PortalCard } from "@/components/client-portal/portal-ui";
import type { PortalSupportData } from "@/lib/client-portal/portal-support";
import { MARKETING_ROUTES } from "@/lib/company/contact";

type PortalSupportCardProps = {
  support: PortalSupportData;
};

export function PortalSupportCard({ support }: PortalSupportCardProps) {
  const email = support.supportEmail;

  return (
    <PortalCard>
      <h2 className="text-lg font-semibold text-foreground">Contact your agency team</h2>
      <p className="mt-2 text-sm text-muted">
        For operational questions about {support.clientName}, contact your agency directly. They manage
        your workspace and can escalate to Auroranexis when needed.
      </p>

      {email ? (
        <p className="mt-4 text-sm text-foreground">
          Support email:{" "}
          <a href={`mailto:${email}`} className="break-all font-medium text-primary hover:underline">
            {email}
          </a>
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Your agency has not published a support email yet. Contact your account owner
          {support.accountOwnerName ? ` (${support.accountOwnerName})` : ""} for assistance.
        </p>
      )}

      {support.contactEmail ? (
        <p className="mt-3 text-sm text-muted">
          Your contact on file:{" "}
          <span className="text-foreground">{support.contactName ?? support.contactEmail}</span>
        </p>
      ) : null}

      <div className="mt-6 rounded-xl border border-border-subtle bg-muted/5 px-4 py-3 text-sm text-muted">
        <p className="font-medium text-foreground">Response expectations</p>
        <p className="mt-1">
          Your agency team typically responds within one business day. Urgent operational issues should
          be flagged as incidents in this portal when available.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {email ? (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`Support request — ${support.clientName}`)}`}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Email support
          </a>
        ) : null}
        <Link
          href={MARKETING_ROUTES.documentation}
          className="inline-flex items-center justify-center rounded-lg border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary"
        >
          Documentation
        </Link>
      </div>
    </PortalCard>
  );
}

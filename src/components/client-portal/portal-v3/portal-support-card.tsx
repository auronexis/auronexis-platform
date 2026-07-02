import Link from "next/link";
import { PortalCard } from "@/components/client-portal/portal-ui";
import type { PortalSupportData } from "@/lib/client-portal/portal-support";

type PortalSupportCardProps = {
  support: PortalSupportData;
};

export function PortalSupportCard({ support }: PortalSupportCardProps) {
  return (
    <PortalCard>
      <h2 className="text-lg font-semibold text-foreground">Support</h2>
      <p className="mt-2 text-sm text-muted">Support requests are coming soon.</p>
      <p className="mt-4 text-sm text-foreground">
        {support.supportEmail ? (
          <>
            Email your agency at{" "}
            <a href={`mailto:${support.supportEmail}`} className="font-medium text-primary hover:underline">
              {support.supportEmail}
            </a>
            .
          </>
        ) : (
          "Your agency team will enable support requests in a future update."
        )}
      </p>
      <fieldset disabled className="mt-6 space-y-4 opacity-60">
        <input
          type="text"
          disabled
          placeholder="Subject (coming soon)"
          className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
        />
        <textarea
          disabled
          rows={3}
          placeholder="Message (coming soon)"
          className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
        />
        <button type="button" disabled className="rounded-lg bg-primary/50 px-4 py-2 text-sm font-medium text-primary-foreground">
          Submit request
        </button>
      </fieldset>
      <Link href="/client-portal/support" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        Open support page
      </Link>
    </PortalCard>
  );
}

import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import Link from "next/link";
import { ContactForm } from "@/components/marketing/contact-form";
import { EnterpriseContactCard } from "@/components/marketing/enterprise-contact-card";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import {
  ACTIVE_ENTERPRISE_CONTACT_CHANNELS,
  FUTURE_ENTERPRISE_CONTACT_CHANNELS,
  MARKETING_ROUTES,
  SUPPORT_EMAIL,
} from "@/lib/company";
import {
  SUPPORT_RESPONSE_EXPECTATIONS,
  SUPPORT_SECURITY_EMAIL,
  SUPPORT_SELF_SERVICE_LINKS,
} from "@/lib/support/content";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createPageMetadataForPath("/support");

export default function SupportPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Support"
        title="We are here to help"
        description="Product support, billing questions, documentation, and Enterprise onboarding."
        primaryHref={`mailto:${SUPPORT_EMAIL}`}
        primaryLabel={`Email ${SUPPORT_EMAIL}`}
        secondaryHref={MARKETING_ROUTES.documentation}
        secondaryLabel="Documentation"
      />

      <MarketingSection title="Primary contact channels">
        <p className="mb-6 max-w-3xl text-sm text-muted">
          Reach the active support, sales, and security teams directly. Each channel is dedicated to a
          specific responsibility so your request is routed efficiently.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {ACTIVE_ENTERPRISE_CONTACT_CHANNELS.map((channel) => (
            <EnterpriseContactCard key={channel.id} channel={channel} variant="marketing" />
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">{SUPPORT_RESPONSE_EXPECTATIONS}</p>
        <p className="mt-3 text-sm text-muted">
          Security vulnerabilities:{" "}
          <Link
            href={`mailto:${SUPPORT_SECURITY_EMAIL}`}
            className="font-medium text-primary hover:underline"
          >
            {SUPPORT_SECURITY_EMAIL}
          </Link>
        </p>
      </MarketingSection>

      <MarketingSection title="Additional enterprise channels" className="border-t border-border/70 bg-surface-2/30">
        <p className="mb-6 max-w-3xl text-sm text-muted">
          Reserved mailboxes for legal, privacy, partnerships, and media inquiries. Channels marked
          pending are not yet monitored — use support@ for urgent requests.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {FUTURE_ENTERPRISE_CONTACT_CHANNELS.map((channel) => (
            <EnterpriseContactCard key={channel.id} channel={channel} variant="marketing" />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title="Self-service resources" className="border-t border-border/70 bg-surface-2/30">
        <div className="grid gap-4 md:grid-cols-2">
          {SUPPORT_SELF_SERVICE_LINKS.map((link) => (
            <article
              key={link.id}
              className={cn(
                "flex h-full flex-col rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm",
                focusRing,
              )}
            >
              <h3 className="font-semibold text-foreground">{link.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{link.description}</p>
              <Link
                href={link.href}
                className={cn("mt-4 inline-block text-sm font-medium text-primary hover:underline", focusRing, "rounded")}
              >
                {link.linkLabel}
              </Link>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title="Send a message" className="border-t border-border/70 bg-surface-2/30">
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Prefer a form? Send a message and we will route it to the right team.
        </p>
        <div className="max-w-2xl">
          <ContactForm />
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}

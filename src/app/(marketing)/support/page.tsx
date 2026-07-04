import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/marketing/contact-form";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { MARKETING_ROUTES, SUPPORT_EMAIL } from "@/lib/company/contact";
import { createMarketingMetadata } from "@/lib/marketing/seo";
import {
  SUPPORT_CHANNELS,
  SUPPORT_RESPONSE_EXPECTATIONS,
  SUPPORT_SECURITY_NOTE,
} from "@/lib/support/content";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createMarketingMetadata({
  title: "Support",
  description: "Auroranexis product support and customer success.",
  path: "/support",
});

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

      <MarketingSection title="Support channels">
        <div className="grid gap-4 md:grid-cols-2">
          {SUPPORT_CHANNELS.map((channel) => (
            <article
              key={channel.id}
              className={cn(
                "rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm",
                focusRing,
              )}
            >
              <h3 className="font-semibold text-foreground">{channel.title}</h3>
              <p className="mt-2 text-sm text-muted">{channel.description}</p>
              <Link
                href={channel.href}
                className={cn("mt-4 inline-block text-sm font-medium text-primary hover:underline", focusRing, "rounded")}
              >
                {channel.linkLabel}
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">{SUPPORT_RESPONSE_EXPECTATIONS}</p>
        <p className="mt-3 text-sm text-muted">
          <Link href={MARKETING_ROUTES.status} className="font-medium text-primary hover:underline">
            System status
          </Link>
          {" · "}
          {SUPPORT_SECURITY_NOTE}
        </p>
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

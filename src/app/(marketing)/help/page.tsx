import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import Link from "next/link";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { HELP_TOPICS } from "@/lib/marketing/content";
import { MARKETING_ROUTES, SUPPORT_EMAIL } from "@/lib/company/contact";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createPageMetadataForPath("/help");

export default function HelpPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Help"
        title="Help Center"
        description="A short index of documentation, FAQ, status, and support channels — not a second documentation hub."
        primaryHref={MARKETING_ROUTES.documentation}
        primaryLabel="View documentation"
        secondaryHref={MARKETING_ROUTES.support}
        secondaryLabel="Support"
      />
      <MarketingSection title="Browse help topics">
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Use this page to find the right destination: product guides at{" "}
          <Link href="/docs" className="font-medium text-primary hover:underline">
            /docs
          </Link>
          , answers in the{" "}
          <Link href={MARKETING_ROUTES.faq} className="font-medium text-primary hover:underline">
            FAQ
          </Link>
          , or email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          for direct assistance.
        </p>
      </MarketingSection>
      <MarketingSection title="Popular topics" className="border-t border-border/70 bg-surface-2/30">
        <div className="grid gap-4 md:grid-cols-2">
          {HELP_TOPICS.map((topic) => (
            <Link key={topic.href} href={topic.href} className={cn("rounded-2xl border border-border-subtle bg-surface-1 p-5 hover:border-primary/20", focusRing)}>
              <h3 className="font-semibold text-foreground">{topic.title}</h3>
              <p className="mt-2 text-sm text-muted">{topic.description}</p>
            </Link>
          ))}
        </div>
      </MarketingSection>
      <MarketingCtaSection
        title="Need more help?"
        description="Visit support for contact channels or book a demo for enterprise onboarding."
        primaryPreset="bookDemo"
        secondaryPreset="viewDocumentation"
      />
    </MarketingShell>
  );
}

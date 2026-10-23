import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MARKETING_ROUTES } from "@/lib/company/company-links";
import { createPageMetadataForPath } from "@/lib/seo";
import { JsonLdScript } from "@/lib/marketing/seo";
import { collectionPageGraphJsonLd } from "@/lib/seo/geo-schema";
import { GUIDES, GUIDES_HUB } from "@/lib/seo/guides-content";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { marketingCardHover } from "@/lib/ui/marketing-motion";

export const metadata: Metadata = createPageMetadataForPath(GUIDES_HUB.path);

export default function GuidesHubPage() {
  return (
    <MarketingShell>
      <JsonLdScript
        data={collectionPageGraphJsonLd({
          title: GUIDES_HUB.title,
          description: GUIDES_HUB.description,
          path: GUIDES_HUB.path,
          items: GUIDES.map((guide) => ({ name: guide.title, path: guide.path, description: guide.summary })),
        })}
      />

      <MarketingHero
        eyebrow="Guides"
        title={GUIDES_HUB.title}
        description="Practical, vendor-neutral guides on client reporting, client profitability and service levels — written to be useful whether or not you use Auroranexis."
        primaryHref={MARKETING_ROUTES.pilotProgram}
        primaryLabel="Apply for the pilot"
        secondaryHref={MARKETING_ROUTES.templates}
        secondaryLabel="Free templates"
      />

      <MarketingSection title="All guides">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((guide) => (
            <article
              key={guide.slug}
              className={cn(
                "flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm",
                marketingCardHover,
              )}
            >
              <h2 className="text-lg font-semibold text-white">
                <Link href={guide.path} className={cn("hover:text-primary", focusRing)}>
                  {guide.title}
                </Link>
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-primary-foreground/75">{guide.summary}</p>
              <p className="mt-4 text-xs text-primary-foreground/60">{guide.readingMinutes} min read</p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingCtaSection
        title="Ready to put these workflows into practice?"
        description="Compare plans or start a workspace when you are ready."
        primaryPreset="seePricing"
        secondaryPreset="startFreeTrial"
      />
    </MarketingShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { createPageMetadataForPath } from "@/lib/seo";
import { JsonLdScript } from "@/lib/marketing/seo";
import { collectionPageGraphJsonLd } from "@/lib/seo/geo-schema";
import {
  ORIGINAL_FRAMEWORK_NOTES,
  RESOURCE_PILLARS,
} from "@/lib/seo/resource-pillars";
import { MARKETING_ROUTES } from "@/lib/company/company-links";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { marketingCardHover } from "@/lib/ui/marketing-motion";

export const metadata: Metadata = createPageMetadataForPath(MARKETING_ROUTES.resources);

export default function ResourcesHubPage() {
  return (
    <MarketingShell>
      <JsonLdScript
        data={collectionPageGraphJsonLd({
          title: "Operations resources for AI agencies and MSPs",
          description:
            "Topical guides connecting Auroranexis capabilities for client health, incidents, SLA, monitoring, and reporting.",
          path: MARKETING_ROUTES.resources,
          items: RESOURCE_PILLARS.map((pillar) => ({
            name: pillar.title,
            path: pillar.primaryHref,
            description: pillar.description,
          })),
        })}
      />

      <MarketingHero
        eyebrow="Resources"
        title="Operational resources for multi-client service teams"
        description="Curated pillars that connect Auroranexis features, solutions, and templates — grounded in real product capabilities, not keyword farms."
        primaryHref={MARKETING_ROUTES.documentation}
        primaryLabel="Open documentation"
        secondaryHref={MARKETING_ROUTES.pricing}
        secondaryLabel="View pricing"
      />

      <MarketingSection
        title="Topic pillars"
        description="Each pillar owns a clear operational theme and links to the primary product pages that already cover that intent."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {RESOURCE_PILLARS.map((pillar) => (
            <article
              key={pillar.id}
              className={cn(
                "flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm",
                marketingCardHover,
              )}
            >
              <h2 className="text-lg font-semibold text-white">
                <Link href={pillar.primaryHref} className={cn("hover:text-primary", focusRing)}>
                  {pillar.title}
                </Link>
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-primary-foreground/75">
                {pillar.description}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {pillar.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={cn("text-primary hover:underline", focusRing)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        title="Original frameworks"
        description="Methodology pages and templates Auroranexis can credibly own — without inventing benchmarks or case studies."
        className="border-t border-white/10"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {ORIGINAL_FRAMEWORK_NOTES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-primary/25",
                focusRing,
              )}
            >
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-primary-foreground/75">{item.summary}</p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">Open →</span>
            </Link>
          ))}
        </div>
      </MarketingSection>

      <MarketingCtaSection
        title="Ready to operationalize these workflows?"
        description="Evaluate plans or start a workspace when you are ready."
        primaryPreset="seePricing"
        secondaryPreset="startFreeTrial"
      />
    </MarketingShell>
  );
}

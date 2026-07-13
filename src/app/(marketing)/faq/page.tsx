import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingFaq, MarketingSection } from "@/components/marketing/marketing-sections";
import { FAQ_TOPICS } from "@/lib/marketing/faq-content";
import { JsonLdScript, faqJsonLd } from "@/lib/marketing/seo";
import { collectionPageGraphJsonLd } from "@/lib/seo/geo-schema";
import { MARKETING_ROUTES } from "@/lib/company/company-links";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createPageMetadataForPath(MARKETING_ROUTES.faq);

export default function FaqPage() {
  const allFaqItems = FAQ_TOPICS.flatMap((topic) => topic.items);

  return (
    <MarketingShell>
      <JsonLdScript
        data={[
          collectionPageGraphJsonLd({
            title: "Frequently asked questions",
            description:
              "Authoritative answers about billing, security, AI, client portal, reports, integrations, and enterprise plans.",
            path: MARKETING_ROUTES.faq,
            items: FAQ_TOPICS.map((topic) => ({
              name: topic.title,
              path: `${MARKETING_ROUTES.faq}#${topic.id}`,
              description: topic.items[0]?.question ?? topic.title,
            })),
          }),
          faqJsonLd(allFaqItems),
        ]}
      />
      <MarketingHero
        eyebrow="FAQ"
        title="Frequently asked questions"
        description="Authoritative answers about billing, security, AI, client portal, reports, integrations, and enterprise plans."
        primaryHref={MARKETING_ROUTES.documentation}
        primaryLabel="View documentation"
        secondaryHref={MARKETING_ROUTES.support}
        secondaryLabel="Contact support"
      />

      <MarketingSection title="Topics">
        <nav aria-label="FAQ topics" className="flex flex-wrap gap-2">
          {FAQ_TOPICS.map((topic) => (
            <a
              key={topic.id}
              href={`#${topic.id}`}
              className={cn(
                "rounded-full border border-white/15 px-3 py-1 text-sm text-primary-foreground/80 hover:border-primary/30 hover:text-white",
                focusRing,
              )}
            >
              {topic.title}
            </a>
          ))}
        </nav>
      </MarketingSection>

      {FAQ_TOPICS.map((topic) => (
        <MarketingSection
          key={topic.id}
          id={topic.id}
          title={topic.title}
          className="border-t border-white/10"
        >
          <MarketingFaq items={topic.items} />
        </MarketingSection>
      ))}

      <MarketingSection title="Related resources" className="border-t border-white/10">
        <ul className="flex flex-wrap gap-3 text-sm">
          <li>
            <Link href={MARKETING_ROUTES.security} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Security
            </Link>
          </li>
          <li>
            <Link href={MARKETING_ROUTES.compliance} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Compliance
            </Link>
          </li>
          <li>
            <Link href={MARKETING_ROUTES.enterprise} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Enterprise
            </Link>
          </li>
          <li>
            <Link href={MARKETING_ROUTES.pricing} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Pricing
            </Link>
          </li>
          <li>
            <Link href={MARKETING_ROUTES.status} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Status
            </Link>
          </li>
        </ul>
      </MarketingSection>

      <MarketingCtaSection
        title="Ready to evaluate Auroranexis?"
        description="Create a workspace or book a demo with our team."
        primaryPreset="startFreeTrial"
        secondaryPreset="bookDemo"
      />
    </MarketingShell>
  );
}

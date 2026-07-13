import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingFaq, MarketingSection } from "@/components/marketing/marketing-sections";
import { MARKETING_CTA_PRESETS } from "@/lib/marketing/cta";
import { JsonLdScript, breadcrumbJsonLd, faqJsonLd } from "@/lib/marketing/seo";
import type { LandingPageContent } from "@/lib/seo/landing-page-types";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type LandingPageViewProps = {
  content: LandingPageContent;
  breadcrumbParent: { name: string; path: string };
};

function SectionList({ items, title }: { items: ReadonlyArray<string>; title: string }) {
  if (items.length === 0) return null;

  return (
    <MarketingSection title={title} className="border-t border-white/10">
      <ul className="grid max-w-3xl gap-2 text-sm text-primary-foreground/80">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="text-primary">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </MarketingSection>
  );
}

export function LandingPageView({ content, breadcrumbParent }: LandingPageViewProps) {
  const primary = MARKETING_CTA_PRESETS[content.primaryCta ?? "startFreeTrial"];
  const secondary = MARKETING_CTA_PRESETS[content.secondaryCta ?? "seePricing"];

  return (
    <MarketingShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: breadcrumbParent.name, path: breadcrumbParent.path },
            { name: content.title, path: content.path },
          ]),
          faqJsonLd(content.faq),
        ]}
      />

      <MarketingHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryHref={primary.href}
        primaryLabel={primary.label}
        secondaryHref={secondary.href}
        secondaryLabel={secondary.label}
      />

      <MarketingSection title="The problem">
        <p className="max-w-3xl text-base leading-relaxed text-primary-foreground/80">{content.problem}</p>
      </MarketingSection>

      <MarketingSection title="How Auroranexis helps" className="border-t border-white/10">
        <p className="max-w-3xl text-base leading-relaxed text-primary-foreground/80">{content.solution}</p>
      </MarketingSection>

      <MarketingSection title="Business value" className="border-t border-white/10">
        <p className="max-w-3xl text-base leading-relaxed text-primary-foreground/80">{content.businessValue}</p>
      </MarketingSection>

      <MarketingSection title="Key benefits" className="border-t border-white/10">
        <div className="grid gap-4 md:grid-cols-3">
          {content.benefits.map((item) => (
            <article key={item.title} className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">{item.description}</p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title="Who it is for" className="border-t border-white/10">
        <p className="max-w-3xl text-base leading-relaxed text-primary-foreground/80">{content.audience}</p>
      </MarketingSection>

      <MarketingSection title="Enterprise advantages" className="border-t border-white/10">
        <ul className="grid max-w-3xl gap-2 text-sm text-primary-foreground/80">
          {content.enterpriseAdvantages.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-primary">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <SectionList items={content.challenges ?? []} title="Common challenges" />
      <SectionList items={content.workflowImprovements ?? []} title="Workflow improvements" />
      <SectionList items={content.expectedOutcomes ?? []} title="Expected outcomes" />

      <MarketingSection title="Capabilities" className="border-t border-white/10">
        <ul className="grid max-w-3xl gap-2 text-sm text-primary-foreground/80">
          {content.capabilities.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-primary">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection title="FAQ" className="border-t border-white/10">
        <MarketingFaq items={content.faq} />
      </MarketingSection>

      <MarketingSection title="Related resources" className="border-t border-white/10">
        <ul className="flex flex-wrap gap-3 text-sm">
          {content.relatedLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingCtaSection
        title="Run client operations from one command center"
        description="Create your workspace, connect clients, and standardize delivery with enterprise-grade controls."
        primaryPreset={content.primaryCta ?? "startFreeTrial"}
        secondaryPreset={content.secondaryCta ?? "contactSales"}
      />
    </MarketingShell>
  );
}

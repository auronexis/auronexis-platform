import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingFaq, MarketingSection } from "@/components/marketing/marketing-sections";
import { JsonLdScript, breadcrumbJsonLd, faqJsonLd } from "@/lib/marketing/seo";
import type { SolutionPageContent } from "@/lib/seo/landing-content";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type SolutionPageViewProps = {
  content: SolutionPageContent;
};

export function SolutionPageView({ content }: SolutionPageViewProps) {
  return (
    <MarketingShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Solutions", path: "/solutions/customer-health-score" },
            { name: content.title, path: content.path },
          ]),
          faqJsonLd(content.faq),
        ]}
      />

      <MarketingHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryHref="/signup"
        primaryLabel="Get started"
        secondaryHref="/pricing"
        secondaryLabel="View pricing"
      />

      <MarketingSection title="Overview">
        <p className="max-w-3xl text-base leading-relaxed text-primary-foreground/80">{content.intro}</p>
      </MarketingSection>

      <MarketingSection title="Key benefits" className="border-t border-white/10">
        <div className="grid gap-4 md:grid-cols-3">
          {content.benefits.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">{item.description}</p>
            </article>
          ))}
        </div>
      </MarketingSection>

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

      <MarketingCta
        title="Run client operations from one command center"
        description="Start with Auroranexis to operationalize delivery, reporting, and client transparency."
        href="/signup"
        label="Create workspace"
      />
    </MarketingShell>
  );
}

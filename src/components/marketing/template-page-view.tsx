import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingFaq, MarketingSection } from "@/components/marketing/marketing-sections";
import { MARKETING_ROUTES } from "@/lib/company";
import { JsonLdScript, breadcrumbJsonLd, faqJsonLd } from "@/lib/marketing/seo";
import type { TemplatePageContent } from "@/lib/seo/landing-content";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type TemplatePageViewProps = {
  content: TemplatePageContent;
};

export function TemplatePageView({ content }: TemplatePageViewProps) {
  return (
    <MarketingShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Templates", path: MARKETING_ROUTES.documentation },
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
        primaryLabel="Use in Auroranexis"
        secondaryHref="/pricing"
        secondaryLabel="View pricing"
      />

      <MarketingSection title="Overview">
        <p className="max-w-3xl text-base leading-relaxed text-primary-foreground/80">{content.intro}</p>
      </MarketingSection>

      {content.sections.map((section) => (
        <MarketingSection key={section.heading} title={section.heading} className="border-t border-white/10">
          <ul className="grid max-w-3xl gap-2 text-sm text-primary-foreground/80">
            {section.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-primary">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </MarketingSection>
      ))}

      <MarketingSection title="Implementation checklist" className="border-t border-white/10">
        <ol className="max-w-3xl list-decimal space-y-2 pl-5 text-sm text-primary-foreground/80">
          {content.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection title="FAQ" className="border-t border-white/10">
        <MarketingFaq items={content.faq} />
      </MarketingSection>

      <MarketingSection title="Next steps" className="border-t border-white/10">
        <p className="text-sm text-primary-foreground/75">
          Ready to operationalize this template?{" "}
          <Link href="/signup" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
            Create a workspace
          </Link>{" "}
          or explore{" "}
          <Link href="/documentation" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
            documentation
          </Link>
          .
        </p>
      </MarketingSection>

      <MarketingCta
        title="Turn templates into live operations"
        description="Auroranexis helps agencies run client delivery, risks, incidents, and reporting from one platform."
        href="/signup"
        label="Get started"
      />
    </MarketingShell>
  );
}

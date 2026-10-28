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
            { name: "Templates", path: MARKETING_ROUTES.templates },
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
        {content.download ? (
          <p className="mt-4">
            <a
              href={content.download.href}
              download
              className={cn(
                "inline-flex items-center rounded-lg border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10",
                focusRing,
              )}
            >
              {content.download.label}
            </a>
          </p>
        ) : null}
      </MarketingSection>

      {content.example ? (
        <MarketingSection title={content.example.heading} className="border-t border-white/10">
          <div className="max-w-full overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm text-primary-foreground/85">
              <caption className="px-4 py-3 text-left text-xs text-primary-foreground/65">
                {content.example.caption}
              </caption>
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-primary-foreground/70">
                <tr>
                  {content.example.columns.map((column) => (
                    <th key={column} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.example.rows.map((row) => (
                  <tr key={row.join("|")} className="border-t border-white/10 align-top">
                    {row.map((cell, index) => (
                      <td
                        key={`${index}-${cell}`}
                        className={cn("px-3 py-2", index === 0 && "whitespace-nowrap font-medium text-white")}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {content.example.note ? (
            <p className="mt-3 max-w-3xl text-xs text-primary-foreground/65">{content.example.note}</p>
          ) : null}
        </MarketingSection>
      ) : null}

      {content.howTo ? (
        <MarketingSection title={content.howTo.heading} className="border-t border-white/10">
          <ol className="max-w-3xl list-decimal space-y-2 pl-5 text-sm text-primary-foreground/80">
            {content.howTo.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </MarketingSection>
      ) : null}

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

      {content.relatedLinks && content.relatedLinks.length > 0 ? (
        <MarketingSection title="Related" className="border-t border-white/10">
          <ul className="grid max-w-3xl gap-2 text-sm sm:grid-cols-2">
            {content.relatedLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </MarketingSection>
      ) : null}

      <MarketingSection title="Next steps" className="border-t border-white/10">
        <p className="text-sm text-primary-foreground/75">
          Ready to operationalize this template?{" "}
          <Link href="/signup" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
            Start the 7-day free trial
          </Link>{" "}
          or explore{" "}
          <Link href={MARKETING_ROUTES.documentation} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
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

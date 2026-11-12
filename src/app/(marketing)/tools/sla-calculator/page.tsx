import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingFaq, MarketingSection } from "@/components/marketing/marketing-sections";
import { CopyCitation, SlaCalculator } from "@/components/marketing/sla-calculator";
import { createPageMetadataForPath } from "@/lib/seo";
import { SLA_CALCULATOR_PAGE as page } from "@/lib/seo/tools-content";
import { SLA_PERIODS, SLA_REFERENCE_TABLE } from "@/lib/tools/sla-calculator";
import { JsonLdScript, breadcrumbJsonLd, faqJsonLd } from "@/lib/marketing/seo";
import { getCanonicalUrl } from "@/lib/company/company-seo";
import { GRAPH_ENTITY_IDS } from "@/lib/seo/entity-graph";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createPageMetadataForPath(page.path);

const linkClass = cn("font-medium text-primary hover:underline", focusRing, "rounded");

function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: page.title,
    description: page.metaDescription,
    url: getCanonicalUrl(page.path).toString(),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web browser)",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: { "@id": GRAPH_ENTITY_IDS.organization },
  };
}

export default function SlaCalculatorPage() {
  const canonical = getCanonicalUrl(page.path).toString();
  const citationHtml = `<a href="${canonical}">${page.citation.anchor}</a> ${page.citation.credit}`;

  return (
    <MarketingShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: page.title, path: page.path },
          ]),
          webApplicationJsonLd(),
          faqJsonLd(page.faq),
        ]}
      />

      <MarketingHero
        eyebrow="Free tool"
        title={page.title}
        description={page.description}
        primaryHref="#calculator"
        primaryLabel="Use the calculator"
        secondaryHref={page.relatedLinks[0].href}
        secondaryLabel="SLA policy template"
      />

      <MarketingSection title="Calculate allowed downtime and uptime">
        <p className="max-w-3xl text-base leading-relaxed text-primary-foreground/80">{page.intro}</p>
        <div id="calculator" className="mt-6 scroll-mt-24">
          <SlaCalculator />
        </div>
      </MarketingSection>

      <MarketingSection title="SLA downtime table" className="border-t border-white/10">
        <div className="max-w-full overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm text-primary-foreground/85">
            <caption className="px-4 py-3 text-left text-xs text-primary-foreground/65">
              Maximum downtime allowed by common availability targets. Month = 30.44 days, year = 365.25 days;
              values are rounded down.
            </caption>
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-primary-foreground/70">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  SLA
                </th>
                {SLA_PERIODS.map((period) => (
                  <th key={period.id} scope="col" className="px-3 py-2 font-semibold">
                    Per {period.label.toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLA_REFERENCE_TABLE.map((row) => (
                <tr key={row.slaPercent} className="border-t border-white/10">
                  <th scope="row" className="px-3 py-2 font-semibold text-white">
                    {row.slaPercent}%
                  </th>
                  {SLA_PERIODS.map((period) => (
                    <td key={period.id} className="px-3 py-2 whitespace-nowrap">
                      {row.downtime[period.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketingSection>

      <MarketingSection title="How the calculation works" className="border-t border-white/10">
        <dl className="grid max-w-4xl gap-3 sm:grid-cols-2">
          {page.formula.map((entry) => (
            <div key={entry.label} className="rounded-xl border border-white/10 p-4 text-sm">
              <dt className="font-semibold text-white">{entry.label}</dt>
              <dd className="mt-2 font-mono text-primary-foreground/90">{entry.expression}</dd>
              <dd className="mt-1 text-xs text-primary-foreground/65">Example: {entry.example}</dd>
            </div>
          ))}
        </dl>
        <h3 className="mt-6 text-sm font-semibold text-white">Assumptions</h3>
        <ul className="mt-2 grid max-w-3xl gap-2 text-sm text-primary-foreground/80">
          {page.assumptions.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="text-primary">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </MarketingSection>

      {page.guidance.map((block) => (
        <MarketingSection key={block.heading} title={block.heading} className="border-t border-white/10">
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 max-w-3xl text-sm leading-relaxed text-primary-foreground/80 first:mt-0">
              {paragraph}
            </p>
          ))}
        </MarketingSection>
      ))}

      <MarketingSection title="FAQ" className="border-t border-white/10">
        <MarketingFaq items={page.faq} />
      </MarketingSection>

      <MarketingSection title="Link to this calculator" className="border-t border-white/10">
        <p className="mb-4 max-w-3xl text-sm text-primary-foreground/80">
          Free to use and to link from your SLA documents, wikis, client handbooks or articles. Copy the link below.
        </p>
        <CopyCitation html={citationHtml} />
      </MarketingSection>

      <MarketingSection title="Related" className="border-t border-white/10">
        <ul className="grid max-w-3xl gap-2 text-sm sm:grid-cols-2">
          {page.relatedLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingCta
        title="Track SLAs for every client in one place"
        description="Auroranexis keeps SLA targets, incidents and client reports per client. Try it for 7 days on the Business plan — no payment details, ends automatically."
        href="/signup"
        label="Start free trial"
      />
    </MarketingShell>
  );
}

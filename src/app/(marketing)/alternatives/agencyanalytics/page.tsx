import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import {
  MarketingFaq,
  MarketingSection,
} from "@/components/marketing/marketing-sections";
import { createPageMetadataForPath } from "@/lib/seo";
import { AGENCYANALYTICS_ALTERNATIVE as page } from "@/lib/seo/comparison-content";
import { JsonLdScript, breadcrumbJsonLd, faqJsonLd } from "@/lib/marketing/seo";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import type { ComparisonRow } from "@/lib/seo/comparison-content";

export const metadata: Metadata = createPageMetadataForPath(page.path);

function ComparisonTable({
  rows,
  caption,
}: {
  rows: readonly ComparisonRow[];
  caption: string;
}) {
  return (
    <>
      {/* Phones: one card per criterion instead of a wide table. */}
      <div className="space-y-3 md:hidden">
        <p className="text-xs text-primary-foreground/65">{caption}</p>
        {rows.map((row) => (
          <div
            key={row.criterion}
            className="rounded-xl border border-white/10 p-4 text-sm"
          >
            <p className="font-semibold text-white">{row.criterion}</p>
            <p className="mt-2 text-primary-foreground/80">
              <span className="font-medium text-primary-foreground">
                {page.competitorName}:{" "}
              </span>
              {row.competitor}
            </p>
            <p className="mt-1 text-primary-foreground/80">
              <span className="font-medium text-primary-foreground">
                Auroranexis:{" "}
              </span>
              {row.auroranexis}
            </p>
          </div>
        ))}
      </div>
      <div className="hidden max-w-full overflow-x-auto rounded-xl border border-white/10 md:block">
        <table className="min-w-full text-left text-sm text-primary-foreground/85">
          <caption className="px-4 py-3 text-left text-xs text-primary-foreground/65">
            {caption}
          </caption>
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-primary-foreground/70">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Criterion
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                {page.competitorName}
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Auroranexis
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.criterion}
                className="border-t border-white/10 align-top"
              >
                <th
                  scope="row"
                  className="whitespace-nowrap px-3 py-2 font-medium text-white"
                >
                  {row.criterion}
                </th>
                <td className="px-3 py-2">{row.competitor}</td>
                <td className="px-3 py-2">{row.auroranexis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
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
  );
}

const linkClass = cn(
  "font-medium text-primary hover:underline",
  focusRing,
  "rounded",
);

export default function AgencyAnalyticsAlternativePage() {
  return (
    <MarketingShell>
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: page.title, path: page.path },
          ]),
          faqJsonLd(page.faq),
        ]}
      />

      <MarketingHero
        eyebrow="Comparison"
        title={page.title}
        description={page.description}
        primaryHref="/signup"
        primaryLabel="Start 7-day free trial"
        secondaryHref="/pricing"
        secondaryLabel="View pricing"
      />

      <MarketingSection title="Why teams look for an alternative">
        <p className="max-w-3xl text-base leading-relaxed text-primary-foreground/80">
          {page.intro}
        </p>
        <p className="mt-3 max-w-3xl text-xs text-primary-foreground/65">
          Facts checked on {page.checkedOn}. Sources are listed at the end of
          the page.
        </p>
      </MarketingSection>

      <MarketingSection
        title={`${page.competitorName} vs Auroranexis`}
        className="border-t border-white/10"
      >
        <ComparisonTable
          rows={page.rows}
          caption={`Based on each vendor's public website, checked ${page.checkedOn}. "Not listed" means the feature does not appear in ${page.competitorName}'s published feature list.`}
        />
      </MarketingSection>

      <MarketingSection
        title={page.costExample.heading}
        className="border-t border-white/10"
      >
        <ComparisonTable
          rows={page.costExample.rows}
          caption={page.costExample.note}
        />
      </MarketingSection>

      <MarketingSection
        title={`When ${page.competitorName} is the better choice`}
        className="border-t border-white/10"
      >
        <Bullets items={page.chooseCompetitor} />
      </MarketingSection>

      <MarketingSection
        title="When Auroranexis fits better"
        className="border-t border-white/10"
      >
        <Bullets items={page.chooseAuroranexis} />
      </MarketingSection>

      <MarketingSection title="Using both" className="border-t border-white/10">
        <p className="max-w-3xl text-sm leading-relaxed text-primary-foreground/80">
          {page.together}
        </p>
      </MarketingSection>

      <MarketingSection title="FAQ" className="border-t border-white/10">
        <MarketingFaq items={page.faq} />
      </MarketingSection>

      <MarketingSection
        title="Sources and method"
        className="border-t border-white/10"
      >
        <ul className="grid max-w-3xl gap-2 text-sm">
          {page.sources.map((source) => (
            <li key={source.href}>
              {source.href.startsWith("http") ? (
                <a
                  href={source.href}
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                  className={linkClass}
                >
                  {source.label}
                </a>
              ) : (
                <Link href={source.href} className={linkClass}>
                  {source.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-3xl text-xs text-primary-foreground/65">
          {page.trademarkNote}
        </p>
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
        title="See your client portfolio in one place"
        description="Try Auroranexis for 7 days on the Business plan — no payment details, ends automatically."
        href="/signup"
        label="Start free trial"
      />
    </MarketingShell>
  );
}

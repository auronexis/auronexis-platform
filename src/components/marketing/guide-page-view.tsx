import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingFaq } from "@/components/marketing/marketing-sections";
import { MARKETING_ROUTES } from "@/lib/company/company-links";
import { JsonLdScript } from "@/lib/marketing/seo";
import { guidePageGraphJsonLd } from "@/lib/seo/geo-schema";
import { GUIDES, GUIDES_AUTHOR, type GuideContent, type GuideLink } from "@/lib/seo/guides-content";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(new Date(`${isoDate}T00:00:00Z`));
}

const linkClass = cn("font-medium text-primary underline-offset-2 hover:underline", focusRing, "rounded");

function LinkRow({ links }: { links: readonly GuideLink[] }) {
  return (
    <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={linkClass}>
          {link.label} →
        </Link>
      ))}
    </p>
  );
}

export function GuidePageView({ guide }: { guide: GuideContent }) {
  const related = GUIDES.filter((other) => other.slug !== guide.slug);

  return (
    <MarketingShell>
      <JsonLdScript
        data={guidePageGraphJsonLd({
          title: guide.title,
          description: guide.description,
          path: guide.path,
          published: guide.published,
          updated: guide.updated,
          author: GUIDES_AUTHOR,
          faq: guide.faq,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Guides", path: MARKETING_ROUTES.guides },
            { name: guide.title, path: guide.path },
          ],
        })}
      />

      <article>
        <header className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-navy-900 to-navy-950" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-6 py-14 sm:py-20">
            <nav aria-label="Breadcrumb" className="text-xs text-primary-foreground/70">
              <Link href={MARKETING_ROUTES.guides} className={cn("hover:text-white", focusRing, "rounded")}>
                Guides
              </Link>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{guide.title}</h1>
            <p className="mt-5 text-sm text-primary-foreground/75">
              By {GUIDES_AUTHOR.name}, {GUIDES_AUTHOR.role} · Updated{" "}
              <time dateTime={guide.updated}>{formatDate(guide.updated)}</time> · {guide.readingMinutes} min read
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
          <div className="space-y-5 text-lg leading-relaxed text-primary-foreground/85">
            {guide.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {guide.sections.map((section) => (
            <section key={section.heading} className="mt-14">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-4 text-base leading-relaxed text-primary-foreground/80">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-5 space-y-3 text-base leading-relaxed text-primary-foreground/80">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3">
                      <span aria-hidden className="mt-0.5 text-primary">
                        •
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.steps ? (
                <ol className="mt-6 space-y-4">
                  {section.steps.map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                      <span
                        aria-hidden
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 text-sm font-semibold text-primary"
                      >
                        {index + 1}
                      </span>
                      <p className="text-base leading-relaxed text-primary-foreground/80">
                        <strong className="font-semibold text-white">{step.title}.</strong> {step.text}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}
              {section.example ? (
                <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/[0.06] p-5">
                  <p className="text-sm font-semibold text-white">{section.example.title}</p>
                  <ul className="mt-2 space-y-1 text-sm leading-relaxed text-primary-foreground/85">
                    {section.example.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {section.closing ? (
                <p className="mt-5 text-base leading-relaxed text-primary-foreground/80">{section.closing}</p>
              ) : null}
              {section.links ? <LinkRow links={section.links} /> : null}
            </section>
          ))}

          <aside className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">{guide.productFit.heading}</h2>
            {guide.productFit.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-base leading-relaxed text-primary-foreground/80">
                {paragraph}
              </p>
            ))}
            <LinkRow links={guide.productFit.links} />
          </aside>

          <section className="mt-16">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Frequently asked questions</h2>
            <div className="mt-6">
              <MarketingFaq items={guide.faq} />
            </div>
          </section>

          {related.length > 0 ? (
            <section className="mt-16">
              <h2 className="text-xl font-semibold text-white">More guides</h2>
              <ul className="mt-4 space-y-3">
                {related.map((other) => (
                  <li key={other.slug}>
                    <Link href={other.path} className={linkClass}>
                      {other.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </article>

      <MarketingCta
        title="Run client operations from one place"
        description="Join the invite-only pilot program: six weeks of dedicated onboarding, influence on the roadmap and pilot pricing."
        href={MARKETING_ROUTES.pilotProgram}
        label="Apply for the pilot"
      />
    </MarketingShell>
  );
}

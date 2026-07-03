import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { COMPANY_NAME, SUPPORT_EMAIL } from "@/lib/company/contact";
import { getDocPageSections } from "@/lib/docs/build-page";
import type { DocContentBlock, DocPageContent, DocSubsection, DocTable } from "@/lib/docs/types";
import { cn } from "@/lib/utils/cn";

const CALLOUT_STYLES = {
  info: "border-primary/25 bg-primary/10 text-primary-foreground/90",
  tip: "border-emerald-500/25 bg-emerald-500/10 text-primary-foreground/90",
  warning: "border-amber-500/25 bg-amber-500/10 text-primary-foreground/90",
} as const;

function renderParagraphs(paragraphs: string[] | undefined, className?: string) {
  if (!paragraphs?.length) return null;
  return paragraphs.map((paragraph) => (
    <p key={paragraph.slice(0, 64)} className={cn("mt-3 text-sm leading-7 text-primary-foreground/80", className)}>
      {paragraph}
    </p>
  ));
}

function renderBullets(items: string[] | undefined) {
  if (!items?.length) return null;
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-primary-foreground/80">
      {items.map((item) => (
        <li key={item.slice(0, 80)}>{item}</li>
      ))}
    </ul>
  );
}

function renderOrdered(items: string[] | undefined) {
  if (!items?.length) return null;
  return (
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-primary-foreground/80">
      {items.map((item) => (
        <li key={item.slice(0, 80)}>{item}</li>
      ))}
    </ol>
  );
}

function renderTable(table: DocTable | undefined) {
  if (!table) return null;
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
      {table.caption ? (
        <p className="border-b border-white/10 px-4 py-2 text-xs font-medium text-primary-foreground/70">
          {table.caption}
        </p>
      ) : null}
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-primary-foreground/90">
          <tr>
            {table.headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold text-white">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.join("-").slice(0, 80)} className="border-t border-white/10">
              {row.map((cell, index) => (
                <td key={`${index}-${cell.slice(0, 40)}`} className="px-4 py-3 text-primary-foreground/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderSubsection(subsection: DocSubsection) {
  return (
    <div key={subsection.title} className="mt-5">
      <h3 className="text-base font-semibold text-white/95">{subsection.title}</h3>
      {renderParagraphs(subsection.paragraphs)}
      {renderBullets(subsection.bullets)}
      {renderOrdered(subsection.ordered)}
      {renderTable(subsection.table)}
    </div>
  );
}

function renderContentBlock(block: DocContentBlock) {
  return (
    <>
      {renderParagraphs(block.paragraphs)}
      {renderBullets(block.bullets)}
      {renderOrdered(block.ordered)}
      {renderTable(block.table)}
      {block.subsections?.map((subsection) => renderSubsection(subsection))}
    </>
  );
}

type DocPageLayoutProps = {
  doc: DocPageContent;
};

export function DocPageLayout({ doc }: DocPageLayoutProps) {
  const sections = getDocPageSections(doc);

  return (
    <MarketingShell>
      <div className="docs-page">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{doc.title}</h1>
              <p className="mt-1 text-sm text-primary-foreground/75">{COMPANY_NAME} documentation</p>
            </div>
            <Link
              href="/docs"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm text-primary-foreground/90 hover:text-white hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All docs
            </Link>
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <p className="text-base leading-7 text-primary-foreground/85">{doc.intro}</p>

          {doc.callouts?.map((callout) => (
            <aside
              key={`${callout.variant}-${callout.title ?? callout.body.slice(0, 32)}`}
              className={cn(
                "mt-6 rounded-xl border px-4 py-3 text-sm leading-relaxed",
                CALLOUT_STYLES[callout.variant],
              )}
            >
              {callout.title ? <p className="font-semibold text-white">{callout.title}</p> : null}
              <p className={callout.title ? "mt-1" : undefined}>{callout.body}</p>
            </aside>
          ))}

          {sections.length > 0 ? (
            <nav
              aria-label="On this page"
              className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-5"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/70">
                On this page
              </h2>
              <ul className="mt-3 columns-1 gap-x-6 space-y-1.5 text-sm sm:columns-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-primary-foreground/85 hover:text-white hover:underline"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
                {doc.faq.length ? (
                  <li>
                    <a href="#faq" className="text-primary-foreground/85 hover:text-white hover:underline">
                      FAQ
                    </a>
                  </li>
                ) : null}
                <li>
                  <a href="#need-help" className="text-primary-foreground/85 hover:text-white hover:underline">
                    Need help?
                  </a>
                </li>
                <li>
                  <a href="#related-docs" className="text-primary-foreground/85 hover:text-white hover:underline">
                    Related documentation
                  </a>
                </li>
              </ul>
            </nav>
          ) : null}

          <div className="mt-10 space-y-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="border-b border-white/10 pb-2 text-lg font-semibold text-white">{section.title}</h2>
                {renderContentBlock(section.block)}
              </section>
            ))}
          </div>

          {doc.faq.length ? (
            <section id="faq" className="mt-12 scroll-mt-24">
              <h2 className="border-b border-white/10 pb-2 text-lg font-semibold text-white">FAQ</h2>
              <dl className="mt-4 space-y-5">
                {doc.faq.map((item) => (
                  <div key={item.question} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <dt className="text-sm font-semibold text-white">{item.question}</dt>
                    <dd className="mt-2 text-sm leading-7 text-primary-foreground/80">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section id="need-help" className="mt-12 scroll-mt-24 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-base font-semibold text-white">
              <LifeBuoy className="h-4 w-4 text-primary" aria-hidden />
              Need help?
            </div>
            <p className="mt-2 text-sm leading-7 text-primary-foreground/80">
              Contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-white hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              for onboarding support, billing questions, or product guidance. Include your workspace name, the module
              you are working in, and a brief description of your goal so we can respond efficiently.
            </p>
          </section>

          <section id="related-docs" className="mt-6 scroll-mt-24 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-base font-semibold text-white">Related documentation</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {doc.relatedDocs.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-primary-foreground/90 hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </MarketingShell>
  );
}

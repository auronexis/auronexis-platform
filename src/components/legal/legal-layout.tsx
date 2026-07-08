import Link from "next/link";
import type { ReactNode } from "react";
import { CompanyInformationCard } from "@/components/legal/company-information-card";
import { LEGAL_NAV } from "@/lib/marketing/content";
import type { LegalPageContent } from "@/lib/company/legal-content";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type LegalLayoutProps = {
  content: LegalPageContent;
  children?: ReactNode;
  showNav?: boolean;
};

const legalNav = LEGAL_NAV;

export function LegalLayout({ content, children, showNav = true }: LegalLayoutProps) {
  return (
    <>
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-white">{content.title}</h1>
          <p className="mt-2 text-sm text-primary-foreground/70">Last updated {content.lastUpdated}</p>
          <p className="mt-4 text-base leading-relaxed text-primary-foreground/80">{content.description}</p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {showNav ? (
          <nav aria-label="Legal pages" className="flex flex-wrap gap-2">
            {legalNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-primary-foreground/75 hover:text-white",
                  focusRing,
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        {content.showCompanyCard ? (
          <CompanyInformationCard
            className={showNav ? "mt-8" : undefined}
            title={content.companyCardTitle ?? "Company information"}
          />
        ) : null}

        <div className={cn("space-y-8", content.showCompanyCard || showNav ? "mt-8" : undefined)}>
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-primary-foreground/75">
                {section.body}
              </p>
            </section>
          ))}
          {children}
        </div>
      </div>
    </>
  );
}

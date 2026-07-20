import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import Link from "next/link";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingFaq, MarketingSection } from "@/components/marketing/marketing-sections";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { SECURITY_HIGHLIGHTS } from "@/lib/marketing/content";
import { FAQ_TOPICS } from "@/lib/marketing/faq-content";
import { JsonLdScript, faqJsonLd } from "@/lib/marketing/seo";
import { LEGAL_ROUTES, MARKETING_ROUTES, SECURITY_EMAIL } from "@/lib/company/contact";

export const metadata: Metadata = createPageMetadataForPath("/security");

const SECURITY_FAQ = FAQ_TOPICS.find((topic) => topic.id === "security")?.items ?? [];

export default function SecurityPage() {
  return (
    <MarketingShell>
      <JsonLdScript data={faqJsonLd(SECURITY_FAQ)} />
      <MarketingHero
        eyebrow="Security"
        title="Security-first operations platform"
        description="Administrative, technical, and organizational controls for B2B SaaS workloads."
        primaryHref={LEGAL_ROUTES.securityPolicy}
        primaryLabel="Security policy"
        secondaryHref={MARKETING_ROUTES.status}
        secondaryLabel="Platform status"
      />
      <MarketingSection title="Security highlights">
        <ul className="space-y-3">
          {SECURITY_HIGHLIGHTS.map((item) => (
            <li key={item} className="rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-muted">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Report vulnerabilities to{" "}
          <a href={`mailto:${SECURITY_EMAIL}`} className="font-medium text-primary hover:underline">
            {SECURITY_EMAIL}
          </a>
          . Review our{" "}
          <Link href={MARKETING_ROUTES.compliance} className="font-medium text-primary hover:underline">
            compliance readiness
          </Link>
          ,{" "}
          <Link href={MARKETING_ROUTES.faq} className="font-medium text-primary hover:underline">
            FAQ
          </Link>
          ,{" "}
          <Link href={MARKETING_ROUTES.status} className="font-medium text-primary hover:underline">
            platform status
          </Link>
          , and{" "}
          <Link href={LEGAL_ROUTES.subprocessors} className="font-medium text-primary hover:underline">
            sub-processors
          </Link>
          ,{" "}
          <Link href="/docs/api" className="font-medium text-primary hover:underline">
            API documentation
          </Link>
          .
        </p>
      </MarketingSection>
      <MarketingSection title="Security FAQ" className="border-t border-border/70 bg-surface-2/30">
        <MarketingFaq items={SECURITY_FAQ} />
      </MarketingSection>
      <MarketingCtaSection
        title="Evaluate Auroranexis for your security requirements"
        description="Review documentation, request an enterprise demo, or contact sales for procurement support."
        primaryPreset="viewDocumentation"
        secondaryPreset="contactSales"
      />
    </MarketingShell>
  );
}

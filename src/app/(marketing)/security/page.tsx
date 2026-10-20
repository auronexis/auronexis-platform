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
        title="Security and trust for agency operations software"
        description="Administrative, technical, and organizational controls for B2B SaaS workloads used by MSPs and agencies — encryption, RBAC, and audit logging. We do not claim SOC 2, ISO, or pentest certifications on this page."
        primaryHref={MARKETING_ROUTES.pricing}
        primaryLabel="See pricing"
        secondaryHref={MARKETING_ROUTES.contact}
        secondaryLabel="Contact sales"
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
          Procurement and enterprise evaluation: review{" "}
          <Link href={MARKETING_ROUTES.pricing} className="font-medium text-primary hover:underline">
            pricing
          </Link>
          ,{" "}
          <Link href={MARKETING_ROUTES.enterprise} className="font-medium text-primary hover:underline">
            enterprise
          </Link>
          , or{" "}
          <Link href={MARKETING_ROUTES.contact} className="font-medium text-primary hover:underline">
            contact sales
          </Link>
          . Security researchers: report vulnerabilities to{" "}
          <a href={`mailto:${SECURITY_EMAIL}`} className="font-medium text-primary hover:underline">
            {SECURITY_EMAIL}
          </a>{" "}
          and read the{" "}
          <Link
            href={MARKETING_ROUTES.vulnerabilityDisclosure}
            className="font-medium text-primary hover:underline"
          >
            Vulnerability Disclosure Policy
          </Link>
          . Also see{" "}
          <Link href={LEGAL_ROUTES.securityPolicy} className="font-medium text-primary hover:underline">
            security policy
          </Link>
          ,{" "}
          <Link href={MARKETING_ROUTES.compliance} className="font-medium text-primary hover:underline">
            compliance readiness
          </Link>
          ,{" "}
          <Link href={MARKETING_ROUTES.status} className="font-medium text-primary hover:underline">
            platform status
          </Link>
          ,{" "}
          <Link href="/docs/api" className="font-medium text-primary hover:underline">
            API documentation
          </Link>
          , and{" "}
          <Link href={LEGAL_ROUTES.subprocessors} className="font-medium text-primary hover:underline">
            sub-processors
          </Link>
          .
        </p>
      </MarketingSection>
      <MarketingSection title="Security FAQ" className="border-t border-border/70 bg-surface-2/30">
        <MarketingFaq items={SECURITY_FAQ} />
      </MarketingSection>
      <MarketingCtaSection
        title="Ready to evaluate Auroranexis for your portfolio?"
        description="Compare plans, talk to sales about enterprise requirements, or review the disclosure policy if you are reporting a vulnerability."
        primaryPreset="seePricing"
        secondaryPreset="contactSales"
      />
    </MarketingShell>
  );
}

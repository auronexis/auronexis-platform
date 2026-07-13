import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import Link from "next/link";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { COMPLIANCE_READINESS } from "@/lib/marketing/content";
import { MARKETING_ROUTES } from "@/lib/company/company-links";

export const metadata: Metadata = createPageMetadataForPath("/compliance");

export default function CompliancePage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Compliance"
        title="Compliance readiness without overclaiming"
        description="We support GDPR obligations and describe readiness for SOC 2, ISO 27001, NIS2, and DORA. We do not claim certifications unless explicitly published."
        primaryHref="/privacy"
        primaryLabel="Privacy policy"
        secondaryHref={MARKETING_ROUTES.faq}
        secondaryLabel="FAQ"
      />
      <MarketingSection title="Framework posture">
        <div className="grid gap-4 md:grid-cols-2">
          {COMPLIANCE_READINESS.map((item) => (
            <article key={item.framework} className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">{item.framework}</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{item.detail}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          <Link href={MARKETING_ROUTES.security} className="font-medium text-primary hover:underline">
            Security practices
          </Link>
          {" · "}
          <Link href="/docs/compliance" className="font-medium text-primary hover:underline">
            Compliance documentation
          </Link>
          {" · "}
          <Link href={MARKETING_ROUTES.enterprise} className="font-medium text-primary hover:underline">
            Enterprise
          </Link>
        </p>
      </MarketingSection>
      <MarketingCtaSection
        title="Discuss compliance requirements"
        description="Enterprise customers receive DPA support and onboarding aligned to procurement needs."
        primaryPreset="enterpriseInquiry"
        secondaryPreset="viewDocumentation"
      />
    </MarketingShell>
  );
}

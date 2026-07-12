import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { COMPLIANCE_READINESS } from "@/lib/marketing/content";

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
      </MarketingSection>
    </MarketingShell>
  );
}

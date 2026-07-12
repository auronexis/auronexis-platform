import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { SALES_EMAIL } from "@/lib/company/contact";

export const metadata: Metadata = createPageMetadataForPath("/careers");

export default function CareersPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Careers"
        title="Build with us"
        description="We are assembling a founding team focused on agency operations, integrations, and EU-trust infrastructure."
        primaryHref={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent("Careers inquiry")}`}
        primaryLabel="Express interest"
      />
      <MarketingSection title="Open roles">
        <p className="text-sm text-muted">
          No public listings yet. Pilot-stage hiring focuses on customer success, solutions engineering, and
          platform engineering. Send your profile to{" "}
          <a href={`mailto:${SALES_EMAIL}`} className="font-medium text-primary hover:underline">
            {SALES_EMAIL}
          </a>
          .
        </p>
      </MarketingSection>
    </MarketingShell>
  );
}

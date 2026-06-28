import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero, MarketingSection } from "@/components/marketing/marketing-sections";
import { SALES_EMAIL } from "@/lib/company/contact";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Careers",
  description: "Careers at Auroranexis — join the founding team.",
  path: "/careers",
});

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

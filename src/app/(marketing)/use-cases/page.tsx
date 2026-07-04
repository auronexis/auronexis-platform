import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingCardGrid, MarketingSection } from "@/components/marketing/marketing-sections";
import { USE_CASES } from "@/lib/marketing/content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Use Cases",
  description: "How MSPs, agencies, consultancies, and automation firms use Auroranexis.",
  path: "/use-cases",
});

export default function UseCasesPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Use Cases"
        title="Built for multi-client operators"
        description="Standardize delivery, prove value, and scale operations across your client portfolio."
        primaryHref="/pilot-program"
        primaryLabel="Apply for Pilot"
      />
      <MarketingSection title="Who we serve">
        <MarketingCardGrid items={USE_CASES} />
      </MarketingSection>
    </MarketingShell>
  );
}

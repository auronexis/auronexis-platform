import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LandingHubView } from "@/components/marketing/landing-hub-view";
import { INDUSTRY_HUB_ENTRIES } from "@/lib/seo/industry-content";
import { MARKETING_ROUTES } from "@/lib/company/company-links";

export const metadata: Metadata = createPageMetadataForPath(MARKETING_ROUTES.industries);

export default function IndustriesHubPage() {
  return (
    <LandingHubView
      eyebrow="Industries"
      title="Client operations by industry"
      description="How service businesses in marketing, IT, accounting, facility services, property management, recruitment, outsourcing, finance, healthcare, legal, and technology run client operations with Auroranexis."
      entries={INDUSTRY_HUB_ENTRIES}
      hubPath={MARKETING_ROUTES.industries}
      secondaryHref={MARKETING_ROUTES.useCases}
      secondaryLabel="View persona use cases"
    />
  );
}

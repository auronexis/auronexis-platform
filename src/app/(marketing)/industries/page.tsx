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
      title="Industry-focused client operations"
      description="See how Auroranexis supports regulated, multi-client delivery across marketing, IT, finance, healthcare, and other sectors."
      entries={INDUSTRY_HUB_ENTRIES}
      hubPath={MARKETING_ROUTES.industries}
      secondaryHref={MARKETING_ROUTES.useCases}
      secondaryLabel="View use cases"
    />
  );
}

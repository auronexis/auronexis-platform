import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LandingHubView } from "@/components/marketing/landing-hub-view";
import { SOLUTION_HUB_ENTRIES } from "@/lib/seo/landing-content";
import { MARKETING_ROUTES } from "@/lib/company/company-links";

export const metadata: Metadata = createPageMetadataForPath(MARKETING_ROUTES.solutions);

export default function SolutionsHubPage() {
  return (
    <LandingHubView
      eyebrow="Solutions"
      title="Operational solutions for agency delivery"
      description="Capability-focused pages for customer health, risk, incidents, SLA tracking, executive dashboards, and automated client reporting."
      entries={SOLUTION_HUB_ENTRIES}
      hubPath={MARKETING_ROUTES.solutions}
      secondaryHref={MARKETING_ROUTES.features}
      secondaryLabel="Explore features"
    />
  );
}

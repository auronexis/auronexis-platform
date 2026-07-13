import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LandingHubView } from "@/components/marketing/landing-hub-view";
import { AUDIENCE_HUB_ENTRIES } from "@/lib/seo/audience-content";
import { MARKETING_ROUTES } from "@/lib/company/company-links";

export const metadata: Metadata = createPageMetadataForPath(MARKETING_ROUTES.useCases);

export default function UseCasesPage() {
  return (
    <LandingHubView
      eyebrow="Use cases"
      title="Built for multi-client operators"
      description="Dedicated pages for MSPs, agencies, consultancies, and enterprise teams that manage client portfolios at scale."
      entries={AUDIENCE_HUB_ENTRIES}
      primaryHref={MARKETING_ROUTES.pilotProgram}
      primaryLabel="Join pilot program"
      secondaryHref={MARKETING_ROUTES.pricing}
      secondaryLabel="Compare plans"
    />
  );
}

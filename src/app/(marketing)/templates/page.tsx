import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { LandingHubView } from "@/components/marketing/landing-hub-view";
import { TEMPLATE_HUB_ENTRIES } from "@/lib/seo/landing-content";
import { MARKETING_ROUTES } from "@/lib/company/company-links";

export const metadata: Metadata = createPageMetadataForPath(MARKETING_ROUTES.templates);

export default function TemplatesHubPage() {
  return (
    <LandingHubView
      eyebrow="Templates"
      title="Operational templates for agency delivery"
      description="Practical frameworks for customer health, risk registers, incident response, SLA policies, and executive reporting — ready to operationalize in Auroranexis."
      entries={TEMPLATE_HUB_ENTRIES}
      hubPath={MARKETING_ROUTES.templates}
      secondaryHref={MARKETING_ROUTES.solutions}
      secondaryLabel="Explore solutions"
    />
  );
}

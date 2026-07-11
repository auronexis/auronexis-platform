import type { Metadata } from "next";
import Link from "next/link";
import { IntegrationCatalogGrid } from "@/components/marketing/integration-catalog-grid";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { INTEGRATION_CATALOG } from "@/lib/marketing/integrations-catalog";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Integrations",
  description: "Connect Auroranexis with billing, AI, messaging, webhooks, and enterprise APIs.",
  path: "/integrations",
});

export default function IntegrationsPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Integrations"
        title="Connect your operational stack"
        description="Native platform services, workflow connectors, and outbound events — built into every workspace."
        primaryHref="/signup"
        primaryLabel="Create workspace"
        secondaryHref="/docs/integrations"
        secondaryLabel="Integration docs"
      />
      <MarketingSection
        title="Integration catalog"
        description={`${INTEGRATION_CATALOG.length} integrations across billing, data, AI, messaging, and automation.`}
      >
        <IntegrationCatalogGrid />
        <p className="mt-10 text-sm text-primary-foreground/75">
          Configure live connectors after signup in Automation → Connectors. See{" "}
          <Link href="/docs/integrations" className="font-medium text-white hover:underline">
            documentation
          </Link>{" "}
          for setup guides and runtime delivery details.
        </p>
      </MarketingSection>
    </MarketingShell>
  );
}

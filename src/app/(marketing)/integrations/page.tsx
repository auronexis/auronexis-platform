import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import Link from "next/link";
import { IntegrationCatalogGrid } from "@/components/marketing/integration-catalog-grid";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { INTEGRATION_CATALOG } from "@/lib/marketing/integrations-catalog";
import { MARKETING_ROUTES, FEATURE_ROUTES } from "@/lib/company/company-links";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createPageMetadataForPath("/integrations");

const RELATED_LINKS = [
  { label: "Integrations feature", href: FEATURE_ROUTES.integrations },
  { label: "Automation", href: FEATURE_ROUTES.automation },
  { label: "API documentation", href: "/docs/api" },
  { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
  { label: "FAQ", href: MARKETING_ROUTES.faq },
] as const;

export default function IntegrationsPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Integrations"
        title="Connect your operational stack"
        description="Native platform services, workflow connectors, and outbound events — built into every workspace."
        primaryHref="/signup"
        primaryLabel="Create workspace"
        secondaryHref="/docs/api"
        secondaryLabel="API reference"
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
      <MarketingSection title="Related resources" className="border-t border-white/10">
        <ul className="flex flex-wrap gap-3 text-sm">
          {RELATED_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
      <MarketingCtaSection
        title="Connect your delivery stack"
        description="Create a workspace and configure connectors for your client operations."
        primaryPreset="startFreeTrial"
        secondaryPreset="viewDocumentation"
      />
    </MarketingShell>
  );
}

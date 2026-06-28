import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero, MarketingSection } from "@/components/marketing/marketing-sections";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Integrations",
  description: "Connect Auroranexis with CRM, ticketing, and productivity tools.",
  path: "/integrations",
});

const INTEGRATIONS = [
  "Slack", "Microsoft Teams", "Google Workspace", "HubSpot", "Salesforce",
  "Jira", "Linear", "Notion", "GitHub", "GitLab", "Zendesk", "ClickUp",
] as const;

export default function IntegrationsPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Integrations"
        title="Connect your operational stack"
        description="OAuth connectors, sync jobs, and integration runtime for agency workflows."
        primaryHref="/signup"
        primaryLabel="Start free trial"
        secondaryHref="/docs/integrations"
        secondaryLabel="Integration docs"
      />
      <MarketingSection title="Supported connectors">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {INTEGRATIONS.map((name) => (
            <div key={name} className="rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm font-medium text-foreground">
              {name}
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          Configure connectors after signup in Automation → Connectors. See{" "}
          <Link href="/docs/integrations" className="font-medium text-primary hover:underline">
            documentation
          </Link>
          .
        </p>
      </MarketingSection>
    </MarketingShell>
  );
}

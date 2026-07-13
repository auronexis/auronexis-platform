import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { FEATURE_HUB_ENTRIES } from "@/lib/seo/feature-content";
import { MARKETING_ROUTES, SOLUTION_ROUTES } from "@/lib/company/company-links";
import Link from "next/link";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingFeatureDetails } from "@/components/marketing/marketing-feature-details";
import { FEATURES } from "@/lib/marketing/content";
import { ConversionTracker } from "@/components/analytics/conversion-tracker";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createPageMetadataForPath("/features");

const SOLUTION_LINKS = [
  { label: "Customer health score", href: SOLUTION_ROUTES.customerHealthScore },
  { label: "Risk management", href: SOLUTION_ROUTES.riskManagement },
  { label: "Incident management", href: SOLUTION_ROUTES.incidentManagement },
  { label: "SLA management", href: SOLUTION_ROUTES.slaManagement },
  { label: "Executive dashboard", href: SOLUTION_ROUTES.executiveDashboard },
  { label: "AI reporting", href: SOLUTION_ROUTES.aiReporting },
] as const;

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <ConversionTracker event="cta_clicked" props={{ surface: "features" }} />
      <MarketingHero
        eyebrow="Features"
        title="Everything your operations team needs"
        description="Reporting, automation, risk management, integrations, and executive intelligence in one workspace."
        primaryHref="/signup"
        primaryLabel="Create workspace"
        secondaryHref="/pricing"
        secondaryLabel="Compare plans"
      />
      <MarketingSection
        title="Feature pages"
        description="Explore dedicated pages for each platform capability."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_HUB_ENTRIES.map((entry) => (
            <Link
              key={entry.path}
              href={entry.path}
              className={cn(
                "flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm transition hover:border-primary/25",
                focusRing,
              )}
            >
              <h3 className="font-semibold text-white">{entry.title}</h3>
              <p className="mt-2 flex-1 text-sm text-primary-foreground/75">{entry.description}</p>
              <span className="mt-4 text-sm font-medium text-primary">Learn more →</span>
            </Link>
          ))}
        </div>
      </MarketingSection>
      <MarketingSection
        title="Platform capabilities"
        description="Each capability maps to a business problem, workflow, and measurable outcome for multi-client delivery teams."
        className="border-t border-white/10"
      >
        <MarketingFeatureDetails features={FEATURES} />
      </MarketingSection>
      <MarketingSection
        title="Related solutions"
        description="Capability-focused solution pages for common agency operating models."
        className="border-t border-white/10"
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTION_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={cn("text-sm font-medium text-primary hover:underline", focusRing, "rounded")}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-primary-foreground/70">
          <Link href={MARKETING_ROUTES.solutions} className="font-medium text-primary hover:underline">
            View all solutions
          </Link>
          {" · "}
          <Link href={MARKETING_ROUTES.industries} className="font-medium text-primary hover:underline">
            Industries
          </Link>
          {" · "}
          <Link href={MARKETING_ROUTES.enterprise} className="font-medium text-primary hover:underline">
            Enterprise
          </Link>
        </p>
      </MarketingSection>
      <MarketingCtaSection
        title="Start with a workspace built for agency operations"
        description="Create your organization, onboard your team, and connect your first clients."
        primaryPreset="startFreeTrial"
        secondaryPreset="bookDemo"
      />
    </MarketingShell>
  );
}

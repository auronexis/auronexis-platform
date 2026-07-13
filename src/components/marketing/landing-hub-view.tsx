import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { JsonLdScript } from "@/lib/marketing/seo";
import { collectionPageGraphJsonLd } from "@/lib/seo/geo-schema";
import type { LandingHubEntry } from "@/lib/seo/landing-page-types";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { marketingCardHover } from "@/lib/ui/marketing-motion";

type LandingHubViewProps = {
  eyebrow: string;
  title: string;
  description: string;
  entries: ReadonlyArray<LandingHubEntry>;
  hubPath: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function LandingHubView({
  eyebrow,
  title,
  description,
  entries,
  hubPath,
  primaryHref = "/signup",
  primaryLabel = "Create workspace",
  secondaryHref = "/pricing",
  secondaryLabel = "Compare plans",
}: LandingHubViewProps) {
  return (
    <MarketingShell>
      <JsonLdScript
        data={collectionPageGraphJsonLd({
          title,
          description,
          path: hubPath,
          items: entries.map((entry) => ({
            name: entry.title,
            path: entry.path,
            description: entry.description,
          })),
        })}
      />
      <MarketingHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
      />

      <MarketingSection title="Explore">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={entry.path}
              href={entry.path}
              className={cn(
                "flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm",
                marketingCardHover,
                focusRing,
              )}
            >
              <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-primary-foreground/75">{entry.description}</p>
              <span className="mt-4 text-sm font-medium text-primary">Learn more →</span>
            </Link>
          ))}
        </div>
      </MarketingSection>

      <MarketingCtaSection
        title="Standardize operations across your portfolio"
        description="Start with a workspace designed for multi-client delivery teams."
        primaryPreset="startFreeTrial"
        secondaryPreset="bookDemo"
      />
    </MarketingShell>
  );
}

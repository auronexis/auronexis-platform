import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { SECURITY_HIGHLIGHTS } from "@/lib/marketing/content";
import { LEGAL_ROUTES, MARKETING_ROUTES, SECURITY_EMAIL } from "@/lib/company/contact";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Security",
  description: "Security practices and trust posture for Auroranexis.",
  path: "/security",
});

export default function SecurityPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Security"
        title="Security-first operations platform"
        description="Administrative, technical, and organizational controls for B2B SaaS workloads."
        primaryHref={LEGAL_ROUTES.securityPolicy}
        primaryLabel="Security policy"
      />
      <MarketingSection title="Security highlights">
        <ul className="space-y-3">
          {SECURITY_HIGHLIGHTS.map((item) => (
            <li key={item} className="rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-muted">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Report vulnerabilities to{" "}
          <a href={`mailto:${SECURITY_EMAIL}`} className="font-medium text-primary hover:underline">
            {SECURITY_EMAIL}
          </a>
          . Review our{" "}
          <Link href={MARKETING_ROUTES.compliance} className="font-medium text-primary hover:underline">
            compliance readiness
          </Link>
          .
        </p>
      </MarketingSection>
    </MarketingShell>
  );
}

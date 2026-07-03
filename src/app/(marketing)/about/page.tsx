import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero, MarketingSection } from "@/components/marketing/marketing-sections";
import { COMPANY_NAME, SUPPORT_EMAIL } from "@/lib/company/contact";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "About",
  description: `About ${COMPANY_NAME} — operations platform for automation agencies.`,
  path: "/about",
});

export default function AboutPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Company"
        title={`About ${COMPANY_NAME}`}
        description="We build the Operations Command Center for AI automation agencies, MSPs, and service providers."
        primaryHref="/pilot-program"
        primaryLabel="Join the pilot"
      />
      <MarketingSection title="Our mission">
        <p className="max-w-3xl text-base leading-relaxed text-muted">
          {COMPANY_NAME} helps agencies monitor client operations, detect risks early, automate delivery,
          and prove value through reporting and client portals. We are pilot-ready and onboarding founding
          customers in Germany and the EU.
        </p>
        <p className="mt-4 text-sm text-muted">
          Contact:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </MarketingSection>
    </MarketingShell>
  );
}

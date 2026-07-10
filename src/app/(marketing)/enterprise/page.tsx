import type { Metadata } from "next";
import { ConversionTracker } from "@/components/analytics/conversion-tracker";
import { DemoBookingForm } from "@/components/marketing/demo-booking-form";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingBenefitsGrid } from "@/components/marketing/marketing-benefits-grid";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingFeatureSection } from "@/components/marketing/marketing-feature-section";
import { MarketingPace } from "@/components/marketing/marketing-pace";
import { MarketingFaq, MarketingSection } from "@/components/marketing/marketing-sections";
import { MarketingStats } from "@/components/marketing/marketing-stats";
import { MARKETING_ROUTES } from "@/lib/company";
import {
  JsonLdScript,
  breadcrumbJsonLd,
  createMarketingMetadata,
  enterpriseOfferJsonLd,
  faqJsonLd,
  organizationJsonLd,
} from "@/lib/marketing/seo";
import { ENTERPRISE_CONTENT } from "@/lib/marketing/enterprise-content";

export const metadata: Metadata = createMarketingMetadata({
  title: "Enterprise",
  description: ENTERPRISE_CONTENT.description,
  path: MARKETING_ROUTES.enterprise,
});

export default function EnterprisePage() {
  return (
    <MarketingShell>
      <ConversionTracker event="enterprise_page_viewed" />
      <JsonLdScript
        data={[
          organizationJsonLd(),
          enterpriseOfferJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Enterprise", path: MARKETING_ROUTES.enterprise },
          ]),
          faqJsonLd(ENTERPRISE_CONTENT.faq),
        ]}
      />

      <MarketingHero
        eyebrow="Enterprise"
        title={ENTERPRISE_CONTENT.title}
        description={ENTERPRISE_CONTENT.description}
        primaryHref={MARKETING_ROUTES.contact}
        primaryLabel="Request enterprise demo"
        secondaryHref={MARKETING_ROUTES.pricing}
        secondaryLabel="See pricing"
      />

      <MarketingPace tone="muted">
        <MarketingSection eyebrow="Scale" title="Built for complex client portfolios">
          <MarketingStats stats={ENTERPRISE_CONTENT.stats} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace bordered>
        <MarketingFeatureSection
          eyebrow="Security"
          title="Enterprise security posture"
          description="Tenant isolation, RBAC, audit trails, and EU-friendly deployment options designed for procurement review."
          visual={
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              {ENTERPRISE_CONTENT.securityHighlights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          }
        />
      </MarketingPace>

      <MarketingPace tone="emphasis">
        <MarketingSection eyebrow="Capabilities" title="What Enterprise includes">
          <MarketingBenefitsGrid benefits={ENTERPRISE_CONTENT.benefits} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace bordered>
        <MarketingSection eyebrow="FAQ" title="Enterprise questions">
          <MarketingFaq items={ENTERPRISE_CONTENT.faq} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace>
        <MarketingSection eyebrow="Discovery" title="Book a tailored walkthrough">
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-primary-foreground/80">
            Share your portfolio size, compliance requirements, and integration needs. We will schedule a
            structured discovery session.
          </p>
          <DemoBookingForm />
        </MarketingSection>
      </MarketingPace>

      <MarketingCtaSection
        title="Ready for enterprise-grade operations?"
        description="Unlimited AI credits, custom limits, and priority support for agencies scaling client delivery."
        primaryPreset="requestEnterpriseDemo"
        secondaryPreset="contactSales"
      />
    </MarketingShell>
  );
}

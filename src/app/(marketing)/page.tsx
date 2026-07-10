import { redirect } from "next/navigation";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingLogoCloud } from "@/components/marketing/marketing-logo-cloud";
import { MarketingPace } from "@/components/marketing/marketing-pace";
import { MarketingStats } from "@/components/marketing/marketing-stats";
import { MarketingTestimonials } from "@/components/marketing/marketing-testimonials";
import {
  MarketingCardGrid,
  MarketingFaq,
  MarketingSection,
} from "@/components/marketing/marketing-sections";
import { getSession } from "@/lib/auth/session";
import {
  COMPLIANCE_READINESS,
  FAQ_ITEMS,
  FEATURES,
  MARKETING_LOGO_CLOUD,
  MARKETING_STATS,
  MARKETING_TESTIMONIALS,
  PUBLIC_PRICING_PLANS,
  PUBLIC_PRICING_NOTE,
  INVITE_ONLY_PROGRAMS_NOTE,
  USE_CASES,
} from "@/lib/marketing/content";
import { MARKETING_ROUTES, SECURITY_EMAIL } from "@/lib/company";
import { COMPANY_SEO } from "@/lib/company/company-seo";
import {
  JsonLdScript,
  createMarketingMetadata,
  faqJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/marketing/seo";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata = createMarketingMetadata({
  title: "Operations Command Center",
  description: COMPANY_SEO.defaultDescription,
  path: "/",
});

export default async function MarketingHomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <MarketingShell>
      <JsonLdScript
        data={[organizationJsonLd(), websiteJsonLd(), softwareApplicationJsonLd(), faqJsonLd(FAQ_ITEMS)]}
      />

      <MarketingHero
        withBanner
        eyebrow="Operations Command Center"
        title="Monitor clients. Detect risks. Prove value."
        description="Auroranexis gives agencies one workspace for reporting, automation, compliance, and client delivery."
        primaryHref="/signup"
        primaryLabel="Get started"
        secondaryHref={MARKETING_ROUTES.documentation}
        secondaryLabel="Documentation"
      />

      <MarketingPace tone="muted">
        <MarketingSection eyebrow="Proof" title="Operations at portfolio scale">
          <MarketingStats stats={MARKETING_STATS} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace bordered>
        <MarketingSection
          id="what-is-auroranexis"
          eyebrow="Product"
          title="What is Auroranexis?"
          description={COMPANY_SEO.defaultDescription}
        >
        <div className="grid max-w-4xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">B2B SaaS platform</h3>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
              Auroranexis is a multi-tenant operations platform for agencies and MSPs managing many clients —
              not a generic CRM or project tool.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">Client intelligence</h3>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
              Combine health signals, risks, incidents, SLA performance, and reporting in one command center.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">Executive insights</h3>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
              Give delivery leaders portfolio visibility and client-ready reports without manual spreadsheet work.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">Who it is for</h3>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
              AI automation agencies, MSPs, IT consultancies, and service providers running recurring client operations.
            </p>
          </article>
        </div>
        <ul className="mt-8 flex flex-wrap gap-3 text-sm">
          <li>
            <Link href="/solutions/customer-health-score" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Customer health score
            </Link>
          </li>
          <li>
            <Link href="/solutions/risk-management" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Risk management
            </Link>
          </li>
          <li>
            <Link href="/solutions/ai-reporting" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              AI reporting
            </Link>
          </li>
          <li>
            <Link href={MARKETING_ROUTES.pricing} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Pricing
            </Link>
          </li>
        </ul>
        </MarketingSection>
      </MarketingPace>

      <MarketingPace>
        <MarketingSection eyebrow="Platform" title="Built for agency operations" description="Everything your team needs to run client operations from one command center.">
          <MarketingCardGrid items={FEATURES} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace tone="emphasis" bordered>
        <MarketingSection
          eyebrow="Use Cases"
          title="Designed for service providers"
          description="From MSPs to automation firms — standardize delivery and prove outcomes."
        >
          <MarketingCardGrid items={USE_CASES} />
        </MarketingSection>
      </MarketingPace>

      <MarketingCtaSection
        title="See plans that scale with your portfolio"
        description="Professional, Business, and Enterprise — transparent pricing with plan-gated AI and operations modules."
        primaryPreset="seePricing"
        secondaryPreset="bookDemo"
      />

      <MarketingPace bordered>
        <MarketingSection eyebrow="Security" title="Enterprise security posture" description="Security-first architecture with EU-friendly deployment options.">
        <ul className="grid gap-3 md:grid-cols-2">
          {[
            "Encryption in transit and at rest",
            "Role-based access control and audit logs",
            `Responsible disclosure via ${SECURITY_EMAIL}`,
            "Aligned with ISO 27001 principles — no certification claimed",
          ].map((item) => (
            <li key={item} className="rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-muted">
              {item}
            </li>
          ))}
        </ul>
        <Link href={MARKETING_ROUTES.security} className={cn("mt-6 inline-flex text-sm font-medium text-primary hover:underline", focusRing, "rounded-lg")}>
          Learn about security →
        </Link>
        </MarketingSection>
      </MarketingPace>

      <MarketingPace tone="muted">
        <MarketingSection
          eyebrow="Compliance"
          title="Compliance readiness"
          description="GDPR support and mapped readiness for SOC 2, ISO 27001, NIS2, and DORA — without claiming certifications."
        >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {COMPLIANCE_READINESS.map((item) => (
            <article key={item.framework} className="rounded-2xl border border-border-subtle bg-surface-1 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">{item.framework}</h3>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{item.detail}</p>
            </article>
          ))}
        </div>
        </MarketingSection>
      </MarketingPace>

      <MarketingPace bordered>
        <MarketingSection eyebrow="Pricing" title="Plans that scale with your agency" description="Professional, Business, and Enterprise — three public subscription tiers with transparent pricing.">
        <div className="grid gap-4 lg:grid-cols-3">
          {PUBLIC_PRICING_PLANS.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "relative rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm",
                plan.featured && "border-primary/20 ring-1 ring-primary/10",
              )}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Recommended
                </span>
              ) : null}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {plan.price}
                {plan.period ? (
                  <span className="text-base font-normal text-muted">{plan.period}</span>
                ) : null}
              </p>
              <p className="mt-3 text-sm text-muted">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {plan.highlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm text-muted">{PUBLIC_PRICING_NOTE}</p>
        <p className="mt-2 max-w-3xl text-sm text-muted">{INVITE_ONLY_PROGRAMS_NOTE}</p>
        <Link href={MARKETING_ROUTES.pricing} className={cn("mt-6 inline-flex text-sm font-medium text-primary hover:underline", focusRing, "rounded-lg")}>
          Compare plans →
        </Link>
        </MarketingSection>
      </MarketingPace>

      <MarketingPace>
        <MarketingSection eyebrow="Trusted by" title="Service-led organizations">
          <MarketingLogoCloud items={MARKETING_LOGO_CLOUD} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace tone="muted" bordered>
        <MarketingSection eyebrow="Voices" title="Operations leaders">
          <MarketingTestimonials items={MARKETING_TESTIMONIALS} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace>
        <MarketingSection eyebrow="FAQ" title="Frequently asked questions">
          <MarketingFaq items={FAQ_ITEMS} />
        </MarketingSection>
      </MarketingPace>

      <MarketingCta
        title="Request a Pilot Partner invitation"
        description="Pilot Partner is invite-only — six weeks of dedicated onboarding, roadmap influence, and approved beta pricing for qualified agencies."
        href={MARKETING_ROUTES.pilotProgram}
        label="Learn about Pilot Partner"
      />
    </MarketingShell>
  );
}

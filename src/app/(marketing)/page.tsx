import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingPlanCta } from "@/components/marketing/marketing-plan-cta";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingCta } from "@/components/marketing/marketing-cta";
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
  PUBLIC_PRICING_NOTE,
  INVITE_ONLY_PROGRAMS_NOTE,
  USE_CASES,
} from "@/lib/marketing/content";
import { loadPublicPricingPlanViews } from "@/lib/marketing/public-pricing";
import { MARKETING_ROUTES, SECURITY_EMAIL } from "@/lib/company";
import { createPageMetadataForPath } from "@/lib/seo";
import { homePageGraphJsonLd } from "@/lib/seo/geo-schema";
import {
  JsonLdScript,
  merchantReturnPolicyJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/marketing/seo";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata: Metadata = createPageMetadataForPath("/");

export default async function MarketingHomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const { plans: publicPricingPlans } = await loadPublicPricingPlanViews();

  return (
    <MarketingShell>
      <JsonLdScript
        data={homePageGraphJsonLd(
          FAQ_ITEMS,
          organizationJsonLd(),
          websiteJsonLd(),
          softwareApplicationJsonLd(),
          merchantReturnPolicyJsonLd(),
        )}
      />

      <MarketingHero
        withBanner
        eyebrow="Operations Command Center"
        title="Client operations software for service businesses"
        description="Know which clients need attention, document every service commitment, and report with confidence. Health scores, SLA tracking, incident records, and automated client reporting in one workspace — for agencies, MSPs, accounting firms, facility and property managers, recruitment firms, and outsourcing providers."
        primaryHref="/signup"
        primaryLabel="Get started"
        secondaryHref={MARKETING_ROUTES.pricing}
        secondaryLabel="See pricing"
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
          description="Client operations software for service businesses with recurring client work: health scores, SLA tracking, incident records, and automated reporting in one workspace."
        >
        <div className="grid max-w-4xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">B2B SaaS platform</h3>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
              Auroranexis is a multi-tenant operations platform for service businesses managing a client portfolio —
              not a generic CRM or project tool.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="text-sm font-semibold text-white">Client intelligence</h3>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
              Combine health signals, risks, incidents, SLA performance, and reporting in one portfolio workspace.
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
              Agencies, MSPs, accounting and bookkeeping firms, facility and property managers, recruitment agencies, and outsourcing providers — any service business delivering recurring work across a client portfolio.
            </p>
          </article>
        </div>
        <ul className="mt-8 flex flex-wrap gap-3 text-sm">
          <li>
            <Link href="/solutions/customer-health-score" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Customer health score software for MSPs
            </Link>
          </li>
          <li>
            <Link href="/solutions/sla-management" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              SLA tracking for MSPs
            </Link>
          </li>
          <li>
            <Link href="/solutions/ai-reporting" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Automated client reporting for agencies
            </Link>
          </li>
          <li>
            <Link href="/solutions/incident-management" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              NIS2 incident management for IT service providers
            </Link>
          </li>
          <li>
            <Link href="/solutions/risk-management" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Operational risk management
            </Link>
          </li>
          <li>
            <Link href="/use-cases/msps" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              MSP portfolio operations
            </Link>
          </li>
          <li>
            <Link href="/features/profitability" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Client and portfolio profitability reporting
            </Link>
          </li>
          <li>
            <Link href="/features/automation" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Agency operations automation
            </Link>
          </li>
          <li>
            <Link href="/industries/marketing" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Client operations for marketing agencies
            </Link>
          </li>
          <li>
            <Link href="/industries/accounting" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Client operations for accounting and bookkeeping firms
            </Link>
          </li>
          <li>
            <Link href="/industries/facility-services" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              SLA tracking for facility and security services
            </Link>
          </li>
          <li>
            <Link href="/industries/property-management" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Owner reporting for property management
            </Link>
          </li>
          <li>
            <Link href="/industries/recruitment" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              Account health for recruitment agencies
            </Link>
          </li>
          <li>
            <Link href="/industries/outsourcing" className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              SLA operations for outsourcing and BPO providers
            </Link>
          </li>
          <li>
            <Link href={MARKETING_ROUTES.pricing} className={cn("font-medium text-primary hover:underline", focusRing, "rounded")}>
              MSP & agency operations pricing
            </Link>
          </li>
        </ul>
        </MarketingSection>
      </MarketingPace>

      <MarketingPace>
        <MarketingSection
          eyebrow="Platform"
          title="Built for multi-client service operations"
          description="Health scores, SLA tracking, incident records, and automated client reporting — without reinventing your delivery stack."
        >
          <MarketingCardGrid items={FEATURES} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace tone="emphasis" bordered>
        <MarketingSection
          eyebrow="Use Cases"
          title="Designed for service providers"
          description="From agencies and MSPs to accounting, facility, and outsourcing firms — standardize delivery and document operational outcomes."
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
        <MarketingSection eyebrow="Security" title="Enterprise security posture" description="Security-first architecture with EU-capable infrastructure.">
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
        <Link href={MARKETING_ROUTES.compliance} className={cn("mt-6 inline-flex text-sm font-medium text-primary hover:underline", focusRing, "rounded-lg")}>
          Review compliance readiness →
        </Link>
        </MarketingSection>
      </MarketingPace>

      <MarketingPace bordered>
        <MarketingSection eyebrow="Pricing" title="Plans that scale with your agency" description="Professional, Business, and Enterprise — three public subscription tiers with transparent pricing.">
        <div className="grid gap-4 lg:grid-cols-3">
          {publicPricingPlans.map((plan) => (
            <article
              key={plan.productPath}
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
              <MarketingPlanCta planName={plan.name} />
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
        <MarketingSection eyebrow="Built for" title="Service-led organizations">
          <MarketingLogoCloud items={MARKETING_LOGO_CLOUD} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace tone="muted" bordered>
        <MarketingSection eyebrow="Priorities" title="What operations leaders look for">
          <MarketingTestimonials items={MARKETING_TESTIMONIALS} />
        </MarketingSection>
      </MarketingPace>

      <MarketingPace>
        <MarketingSection eyebrow="FAQ" title="Frequently asked questions">
          <MarketingFaq items={FAQ_ITEMS} />
          <Link href={MARKETING_ROUTES.faq} className={cn("mt-6 inline-flex text-sm font-medium text-primary hover:underline", focusRing, "rounded-lg")}>
            Browse all FAQ topics →
          </Link>
        </MarketingSection>
      </MarketingPace>

      <MarketingCtaSection
        title="Create your agency workspace"
        description="Set up Auroranexis, invite your team, and start managing client health, SLA, incidents, and reporting in one operations workspace."
        primaryPreset="startFreeTrial"
        secondaryPreset="seePricing"
      />

      <MarketingCta
        title="Request a Pilot Partner invitation"
        description="Pilot Partner is invite-only — six weeks of dedicated onboarding, roadmap influence, and approved beta pricing for qualified agencies."
        href={MARKETING_ROUTES.pilotProgram}
        label="Learn about Pilot Partner"
      />
    </MarketingShell>
  );
}

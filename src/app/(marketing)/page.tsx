import { redirect } from "next/navigation";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import {
  MarketingCardGrid,
  MarketingCta,
  MarketingFaq,
  MarketingHero,
  MarketingSection,
} from "@/components/marketing/marketing-sections";
import { getSession } from "@/lib/auth/session";
import {
  COMPLIANCE_READINESS,
  FAQ_ITEMS,
  FEATURES,
  PUBLIC_PRICING_PLANS,
  PUBLIC_PRICING_NOTE,
  USE_CASES,
} from "@/lib/marketing/content";
import { MARKETING_ROUTES } from "@/lib/company/contact";
import {
  JsonLdScript,
  createMarketingMetadata,
  faqJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/marketing/seo";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

export const metadata = createMarketingMetadata({
  title: "Operations Command Center",
  description:
    "Monitor clients. Detect risks. Prove value. Auroranexis is the operations platform for MSPs and automation agencies.",
  path: "/",
});

export default async function MarketingHomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <MarketingShell>
      <JsonLdScript data={[organizationJsonLd(), softwareApplicationJsonLd(), faqJsonLd(FAQ_ITEMS)]} />

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

      <MarketingSection eyebrow="Platform" title="Built for agency operations" description="Everything your team needs to run client operations from one command center.">
        <MarketingCardGrid items={FEATURES} />
      </MarketingSection>

      <MarketingSection
        eyebrow="Use Cases"
        title="Designed for service providers"
        description="From MSPs to automation firms — standardize delivery and prove outcomes."
        className="border-t border-border/70 bg-surface-2/30"
      >
        <MarketingCardGrid items={USE_CASES} />
      </MarketingSection>

      <MarketingSection eyebrow="Security" title="Enterprise security posture" description="Security-first architecture with EU-friendly deployment options.">
        <ul className="grid gap-3 md:grid-cols-2">
          {[
            "Encryption in transit and at rest",
            "Role-based access control and audit logs",
            "Responsible disclosure via security@auroranexis.com",
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

      <MarketingSection
        eyebrow="Compliance"
        title="Compliance readiness"
        description="GDPR support and mapped readiness for SOC 2, ISO 27001, NIS2, and DORA — without claiming certifications."
        className="border-t border-border/70 bg-surface-2/30"
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

      <MarketingSection eyebrow="Pricing" title="Plans that scale with your agency" description="Professional, Business, and Enterprise — transparent subscription pricing. Pilot Partner and Founding cohorts are separate limited programs.">
        <div className="grid gap-4 lg:grid-cols-3">
          {PUBLIC_PRICING_PLANS.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm",
                plan.featured && "border-primary/20 ring-1 ring-primary/10",
              )}
            >
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
        <Link href={MARKETING_ROUTES.pricing} className={cn("mt-6 inline-flex text-sm font-medium text-primary hover:underline", focusRing, "rounded-lg")}>
          Compare plans →
        </Link>
      </MarketingSection>

      <MarketingSection eyebrow="FAQ" title="Frequently asked questions">
        <MarketingFaq items={FAQ_ITEMS} />
      </MarketingSection>

      <MarketingCta
        title="Apply for the pilot program"
        description="Join the founding customer cohort — 6 weeks, dedicated onboarding, roadmap influence, and 50% beta pricing."
        href={MARKETING_ROUTES.pilotProgram}
        label="Apply for Pilot"
      />
    </MarketingShell>
  );
}

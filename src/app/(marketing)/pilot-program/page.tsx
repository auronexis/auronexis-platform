import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PilotApplicationForm } from "@/components/marketing/pilot-application-form";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { getSession } from "@/lib/auth/session";
import { resolveOrganizationEntitlements } from "@/lib/entitlements/resolver";
import { PILOT_PROGRAM } from "@/lib/marketing/content";
import { JsonLdScript, pilotProgramJsonLd } from "@/lib/marketing/seo";
import { evaluatePilotApplicationEligibility } from "@/lib/sales/pilot-eligibility";

export const metadata: Metadata = createPageMetadataForPath("/pilot-program");

export default async function PilotProgramPage() {
  const session = await getSession();
  let blockedReason: string | null = null;
  if (session) {
    const entitlements = await resolveOrganizationEntitlements(session.organization.id, {
      session,
    });
    const eligibility = evaluatePilotApplicationEligibility({
      hasAuthenticatedOrganization: true,
      isPaidAccess: entitlements.isPaidAccess && !entitlements.isTrial,
    });
    if (!eligibility.allowed) {
      blockedReason = eligibility.reason;
    }
  }

  return (
    <MarketingShell>
      <JsonLdScript data={pilotProgramJsonLd()} />
      <MarketingHero
        eyebrow="6-week pilot program"
        title="Run Auroranexis with your own clients for six weeks"
        description="Guided workspace setup, weekly written check-ins and pilot terms agreed in writing. If you received an email from Tamas at Auroranexis, that email is your invitation — apply below."
        primaryHref="#apply"
        primaryLabel="Apply for the pilot"
        secondaryHref="/signup"
        secondaryLabel="Or start a 7-day free trial"
      />

      <MarketingSection title="How the pilot works">
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PILOT_PROGRAM.steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/60">Step {index + 1}</p>
              <h3 className="mt-2 font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-primary-foreground/75">{step.description}</p>
            </li>
          ))}
        </ol>
      </MarketingSection>

      <MarketingSection title="What is included">
        <ul className="grid gap-3 md:grid-cols-2">
          {PILOT_PROGRAM.includes.map((item) => (
            <li key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-primary-foreground/75">
              {item}
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection title="Program details" className="border-t border-white/10 bg-white/[0.02]">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold text-white">Duration</h3>
            <p className="mt-2 text-sm text-primary-foreground/75">{PILOT_PROGRAM.duration}</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold text-white">Pilot terms</h3>
            <p className="mt-2 text-sm text-primary-foreground/75">{PILOT_PROGRAM.discount}</p>
          </article>
        </div>
      </MarketingSection>

      <MarketingSection id="apply" title="Apply for the pilot">
        <div className="max-w-2xl">
          <PilotApplicationForm blockedReason={blockedReason} />
        </div>
      </MarketingSection>

      <MarketingSection title="Who the program is for">
        <div className="flex flex-wrap gap-2">
          {PILOT_PROGRAM.targets.map((target) => (
            <span key={target} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-primary-foreground/75">
              {target}
            </span>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title="Requirements">
        <ul className="space-y-2 text-sm text-primary-foreground/75">
          {PILOT_PROGRAM.requirements.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection title="Benefits" className="border-t border-white/10 bg-white/[0.02]">
        <ul className="grid gap-3 sm:grid-cols-2">
          {PILOT_PROGRAM.benefits.map((item) => (
            <li key={item} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-primary-foreground/75">
              {item}
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingCta
        title="Prefer to try it on your own first?"
        description="Start a 7-day free trial of the Business plan. No credit card, no payment details, and the trial ends automatically."
        href="/signup"
        label="Start 7-day free trial"
      />
    </MarketingShell>
  );
}

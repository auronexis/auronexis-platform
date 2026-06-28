import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PilotApplicationForm } from "@/components/marketing/pilot-application-form";
import { MarketingCta, MarketingHero, MarketingSection } from "@/components/marketing/marketing-sections";
import { PILOT_PROGRAM } from "@/lib/marketing/content";
import { MARKETING_ROUTES } from "@/lib/company/contact";
import {
  JsonLdScript,
  createMarketingMetadata,
  pilotProgramJsonLd,
} from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Pilot Program",
  description: "Apply for the Auroranexis founding customer pilot — 6 weeks, 50% beta pricing.",
  path: "/pilot-program",
});

export default function PilotProgramPage() {
  return (
    <MarketingShell>
      <JsonLdScript data={pilotProgramJsonLd()} />
      <MarketingHero
        eyebrow="Pilot Program"
        title="Founding customer pilot"
        description="Six weeks of dedicated onboarding, roadmap influence, and 50% beta pricing for qualified agencies."
        primaryHref="#apply"
        primaryLabel="Apply below"
        secondaryHref={MARKETING_ROUTES.contact}
        secondaryLabel="Contact sales"
      />

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
            <h3 className="font-semibold text-white">Beta pricing</h3>
            <p className="mt-2 text-sm text-primary-foreground/75">{PILOT_PROGRAM.discount}</p>
          </article>
        </div>
      </MarketingSection>

      <MarketingSection id="apply" title="Apply for the pilot">
        <div className="max-w-2xl">
          <PilotApplicationForm />
        </div>
      </MarketingSection>

      <MarketingSection title="Target companies">
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
        title="Ready to join the cohort?"
        description="Submit your application above or contact sales for a discovery call."
        href="#apply"
        label="Apply for Pilot"
      />
    </MarketingShell>
  );
}

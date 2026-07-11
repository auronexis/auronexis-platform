import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import {
  COMPANY_NAME,
  COMPANY_SEO,
  LEGAL_ROUTES,
  MARKETING_ROUTES,
  SALES_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "About",
  description: `About ${COMPANY_NAME} — ${COMPANY_SEO.defaultDescription}`,
  path: "/about",
});

const VALUES = [
  {
    title: "Operational clarity",
    body: "Give agencies a single command center for clients, risks, incidents, reports, and automation — not another spreadsheet.",
  },
  {
    title: "Trust by design",
    body: "Multi-tenant isolation, audit trails, and transparent security practices built for B2B workloads and client portals.",
  },
  {
    title: "Prove value",
    body: "Help teams demonstrate outcomes to clients through reporting, health signals, and executive-ready deliverables.",
  },
] as const;

export default function AboutPage() {
  return (
    <MarketingShell>
      <MarketingHero
        eyebrow="Company"
        title={`About ${COMPANY_NAME}`}
        description="We build the Operations Command Center for AI automation agencies, MSPs, and service providers."
        primaryHref="/pricing"
        primaryLabel="View pricing"
        secondaryHref="/contact"
        secondaryLabel="Contact us"
      />
      <MarketingSection title="Our mission">
        <p className="max-w-3xl text-base leading-relaxed text-muted">
          {COMPANY_NAME} helps agencies monitor client operations, detect risks early, automate delivery,
          and prove value through reporting and client portals. Public plans are Professional, Business, and
          Enterprise. Pilot and Founding programs are invite-only.
        </p>
      </MarketingSection>
      <MarketingSection title="What we believe">
        <ul className="grid gap-4 md:grid-cols-3">
          {VALUES.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-border-subtle bg-surface-1 px-5 py-5"
            >
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </MarketingSection>
      <MarketingSection title="Trust and transparency">
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          We publish security practices, compliance readiness, platform status, and legal policies so customers
          can evaluate Auroranexis with confidence.
        </p>
        <ul className="mt-6 flex flex-wrap gap-3 text-sm">
          <li>
            <Link href={MARKETING_ROUTES.security} className="font-medium text-primary hover:underline">
              Security
            </Link>
          </li>
          <li>
            <Link href={MARKETING_ROUTES.status} className="font-medium text-primary hover:underline">
              Platform status
            </Link>
          </li>
          <li>
            <Link href={MARKETING_ROUTES.compliance} className="font-medium text-primary hover:underline">
              Compliance
            </Link>
          </li>
          <li>
            <Link href="/api/docs" className="font-medium text-primary hover:underline">
              API documentation
            </Link>
          </li>
          <li>
            <Link href={LEGAL_ROUTES.privacy} className="font-medium text-primary hover:underline">
              Privacy
            </Link>
          </li>
        </ul>
      </MarketingSection>
      <MarketingSection title="Contact">
        <p className="text-sm text-muted">
          Product support:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
          . Sales and partnerships:{" "}
          <a href={`mailto:${SALES_EMAIL}`} className="font-medium text-primary hover:underline">
            {SALES_EMAIL}
          </a>
          .
        </p>
      </MarketingSection>
    </MarketingShell>
  );
}

import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import {
  COMPANY_INFORMATION,
  COMPANY_NAME,
  LEGAL_ROUTES,
  MARKETING_ROUTES,
  SALES_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company";
import { JsonLdScript, aboutPageJsonLd } from "@/lib/marketing/seo";
import { PAGE_SEO } from "@/lib/seo/routes";

export const metadata: Metadata = createPageMetadataForPath("/about");

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
  const aboutSeo = PAGE_SEO["/about"];
  return (
    <MarketingShell>
      <JsonLdScript
        data={aboutPageJsonLd({
          title: aboutSeo.title,
          description: aboutSeo.description,
        })}
      />
      <MarketingHero
        eyebrow="Company"
        title={`About ${COMPANY_NAME}`}
        description="We build the Operations Command Center for AI automation agencies, MSPs, and service providers."
        primaryHref="/pricing"
        primaryLabel="View pricing"
        secondaryHref="/contact"
        secondaryLabel="Contact us"
      />
      <MarketingSection title="Company identity">
        <dl className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Legal entity</dt>
            <dd className="mt-1 text-sm text-foreground">{COMPANY_INFORMATION.legalName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Product</dt>
            <dd className="mt-1 text-sm text-foreground">{COMPANY_INFORMATION.productName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Founder</dt>
            <dd className="mt-1 text-sm text-foreground">{COMPANY_INFORMATION.owner}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Headquarters</dt>
            <dd className="mt-1 text-sm text-foreground">
              {COMPANY_INFORMATION.city}, {COMPANY_INFORMATION.country}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Business type</dt>
            <dd className="mt-1 text-sm text-foreground">{COMPANY_INFORMATION.businessType}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Imprint</dt>
            <dd className="mt-1 text-sm">
              <Link href={LEGAL_ROUTES.imprint} className="font-medium text-primary hover:underline">
                Legal provider identification
              </Link>
            </dd>
          </div>
        </dl>
      </MarketingSection>
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
            <Link href="/docs/api" className="font-medium text-primary hover:underline">
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
      <MarketingSection title="Evaluate Auroranexis">
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          Enterprise buyers can review security practices, compliance readiness, platform status,
          subprocessors, API documentation, and pricing before creating a workspace.
        </p>
        <ol className="mt-6 max-w-3xl list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Review <Link href={MARKETING_ROUTES.security} className="font-medium text-primary hover:underline">security</Link> and <Link href={MARKETING_ROUTES.compliance} className="font-medium text-primary hover:underline">compliance readiness</Link></li>
          <li>Check <Link href={MARKETING_ROUTES.status} className="font-medium text-primary hover:underline">platform status</Link> and <Link href={LEGAL_ROUTES.subprocessors} className="font-medium text-primary hover:underline">sub-processors</Link></li>
          <li>Read <Link href="/docs" className="font-medium text-primary hover:underline">product documentation</Link> and <Link href={MARKETING_ROUTES.faq} className="font-medium text-primary hover:underline">FAQ</Link></li>
          <li>Compare <Link href={MARKETING_ROUTES.pricing} className="font-medium text-primary hover:underline">plans</Link> or <Link href={MARKETING_ROUTES.contact} className="font-medium text-primary hover:underline">contact sales</Link> for enterprise procurement</li>
        </ol>
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

import { buildDocPage } from "@/lib/docs/build-page";
import type { DocPageContent } from "@/lib/docs/types";
import {
  API_DOC as API_DOC_INPUT,
  BILLING_DOC as BILLING_DOC_INPUT,
  ENTERPRISE_DOC as ENTERPRISE_DOC_INPUT,
  SECURITY_DOC as SECURITY_DOC_INPUT,
} from "@/lib/docs/pages/account";
import {
  COMPLIANCE_DOC as COMPLIANCE_DOC_INPUT,
  DOCS_HUB_DOC as DOCS_HUB_DOC_INPUT,
  PREDICTIVE_DOC as PREDICTIVE_DOC_INPUT,
  WHITE_LABEL_DOC as WHITE_LABEL_DOC_INPUT,
} from "@/lib/docs/pages/extras";
import {
  CLIENTS_DOC as CLIENTS_DOC_INPUT,
  GETTING_STARTED_DOC as GETTING_STARTED_DOC_INPUT,
  INCIDENTS_DOC as INCIDENTS_DOC_INPUT,
  MONITORING_DOC as MONITORING_DOC_INPUT,
  REPORTS_DOC as REPORTS_DOC_INPUT,
  RISKS_DOC as RISKS_DOC_INPUT,
  SLA_DOC as SLA_DOC_INPUT,
} from "@/lib/docs/pages/operations";
import {
  AUTOMATION_DOC as AUTOMATION_DOC_INPUT,
  CLIENT_PORTAL_DOC as CLIENT_PORTAL_DOC_INPUT,
  INTEGRATIONS_DOC as INTEGRATIONS_DOC_INPUT,
} from "@/lib/docs/pages/platform";

export const GETTING_STARTED_DOC = buildDocPage(GETTING_STARTED_DOC_INPUT);
export const CLIENTS_DOC = buildDocPage(CLIENTS_DOC_INPUT);
export const REPORTS_DOC = buildDocPage(REPORTS_DOC_INPUT);
export const RISKS_DOC = buildDocPage(RISKS_DOC_INPUT);
export const INCIDENTS_DOC = buildDocPage(INCIDENTS_DOC_INPUT);
export const MONITORING_DOC = buildDocPage(MONITORING_DOC_INPUT);
export const SLA_DOC = buildDocPage(SLA_DOC_INPUT);
export const AUTOMATION_DOC = buildDocPage(AUTOMATION_DOC_INPUT);
export const INTEGRATIONS_DOC = buildDocPage(INTEGRATIONS_DOC_INPUT);
export const CLIENT_PORTAL_DOC = buildDocPage(CLIENT_PORTAL_DOC_INPUT);
export const BILLING_DOC = buildDocPage(BILLING_DOC_INPUT);
export const SECURITY_DOC = buildDocPage(SECURITY_DOC_INPUT);
export const API_DOC = buildDocPage(API_DOC_INPUT);
export const ENTERPRISE_DOC = buildDocPage(ENTERPRISE_DOC_INPUT);
export const COMPLIANCE_DOC = buildDocPage(COMPLIANCE_DOC_INPUT);
export const WHITE_LABEL_DOC = buildDocPage(WHITE_LABEL_DOC_INPUT);
export const PREDICTIVE_DOC = buildDocPage(PREDICTIVE_DOC_INPUT);
export const DOCS_HUB_DOC = buildDocPage(DOCS_HUB_DOC_INPUT);

export const DOC_PAGES: DocPageContent[] = [
  GETTING_STARTED_DOC,
  CLIENTS_DOC,
  REPORTS_DOC,
  RISKS_DOC,
  INCIDENTS_DOC,
  MONITORING_DOC,
  SLA_DOC,
  AUTOMATION_DOC,
  INTEGRATIONS_DOC,
  CLIENT_PORTAL_DOC,
  BILLING_DOC,
  SECURITY_DOC,
  API_DOC,
  ENTERPRISE_DOC,
  COMPLIANCE_DOC,
  WHITE_LABEL_DOC,
  PREDICTIVE_DOC,
];

const DOC_PAGE_MAP = new Map<string, DocPageContent>(
  DOC_PAGES.map((page) => [page.slug, page]),
);

export function getDocPage(slug: string): DocPageContent | undefined {
  return DOC_PAGE_MAP.get(slug);
}

export function getAllDocSlugs(): string[] {
  return DOC_PAGES.map((page) => page.slug);
}

/** Public documentation slugs for sitemap and SEO registry. */
export const DOC_PAGE_SLUGS = DOC_PAGES.map((page) => page.slug) as readonly string[];

export type DocHubCard = {
  slug: string;
  title: string;
  description: string;
  module:
    | "dashboard"
    | "clients"
    | "reports"
    | "workflows"
    | "settings";
  href?: string;
};

export const DOC_HUB_CARDS: DocHubCard[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: GETTING_STARTED_DOC.description,
    module: "dashboard",
  },
  {
    slug: "clients",
    title: "Clients",
    description: CLIENTS_DOC.description,
    module: "clients",
  },
  {
    slug: "reports",
    title: "Reports",
    description: REPORTS_DOC.description,
    module: "reports",
  },
  {
    slug: "risks",
    title: "Risks",
    description: RISKS_DOC.description,
    module: "clients",
  },
  {
    slug: "incidents",
    title: "Incidents",
    description: INCIDENTS_DOC.description,
    module: "clients",
  },
  {
    slug: "monitoring",
    title: "Monitoring",
    description: MONITORING_DOC.description,
    module: "clients",
  },
  {
    slug: "sla",
    title: "SLA Policies",
    description: SLA_DOC.description,
    module: "settings",
  },
  {
    slug: "automation",
    title: "Automation",
    description: AUTOMATION_DOC.description,
    module: "workflows",
  },
  {
    slug: "integrations",
    title: "Integrations",
    description: INTEGRATIONS_DOC.description,
    module: "workflows",
  },
  {
    slug: "client-portal",
    title: "Client Portal",
    description: CLIENT_PORTAL_DOC.description,
    module: "clients",
  },
  {
    slug: "billing",
    title: "Billing",
    description: BILLING_DOC.description,
    module: "settings",
  },
  {
    slug: "security",
    title: "Security",
    description: SECURITY_DOC.description,
    module: "settings",
  },
  {
    slug: "api",
    title: "API",
    description: API_DOC.description,
    module: "settings",
  },
  {
    slug: "enterprise",
    title: "Enterprise",
    description: ENTERPRISE_DOC.description,
    module: "settings",
  },
  {
    slug: "compliance",
    title: "Compliance",
    description: COMPLIANCE_DOC.description,
    module: "settings",
  },
  {
    slug: "white-label",
    title: "White Label",
    description: WHITE_LABEL_DOC.description,
    module: "settings",
  },
  {
    slug: "predictive",
    title: "Predictive Intelligence",
    description: PREDICTIVE_DOC.description,
    module: "dashboard",
  },
];

/**
 * Edge-safe allowlists for public marketing/docs dynamic segments.
 * Keep in sync with FEATURE_ROUTES / SOLUTION_ROUTES / TEMPLATE_ROUTES /
 * USE_CASE_ROUTES / INDUSTRY_ROUTES / DOC_PAGE_SLUGS (+ release-notes page).
 *
 * Middleware uses these to return hard HTTP 404 for unknown slugs —
 * Next.js notFound() alone has been observed returning soft-404 (HTTP 200)
 * for unmatched [slug] params on production.
 */

const FEATURE_SLUGS = new Set([
  "ai-executive-reports",
  "ai-copilot",
  "client-portal",
  "automation",
  "monitoring",
  "risk-intelligence",
  "health-monitoring",
  "executive-dashboards",
  "knowledge-base",
  "incidents",
  "profitability",
  "customer-success",
  "reports",
  "activity-timeline",
  "integrations",
]);

const SOLUTION_SLUGS = new Set([
  "customer-health-score",
  "risk-management",
  "incident-management",
  "sla-management",
  "executive-dashboard",
  "ai-reporting",
]);

const TEMPLATE_SLUGS = new Set([
  "customer-health-score",
  "risk-register",
  "incident-response",
  "sla-policy",
  "executive-report",
]);

const USE_CASE_SLUGS = new Set([
  "marketing-agencies",
  "it-service-providers",
  "msps",
  "consultancies",
  "cybersecurity-companies",
  "digital-agencies",
  "software-agencies",
  "automation-agencies",
  "enterprise-teams",
]);

const INDUSTRY_SLUGS = new Set([
  "marketing",
  "it",
  "cybersecurity",
  "consulting",
  "healthcare",
  "finance",
  "legal",
  "manufacturing",
  "technology",
]);

/** Doc topic slugs under /docs/[slug] — plus dedicated /docs/release-notes page. */
const DOC_SLUGS = new Set([
  "getting-started",
  "clients",
  "reports",
  "risks",
  "incidents",
  "monitoring",
  "sla",
  "automation",
  "integrations",
  "client-portal",
  "billing",
  "security",
  "api",
  "enterprise",
  "compliance",
  "white-label",
  "predictive",
  "knowledge",
  "profitability",
  "customer-success",
  "activity",
  "release-notes",
]);

const DYNAMIC_PREFIXES: ReadonlyArray<{ prefix: string; slugs: ReadonlySet<string> }> = [
  { prefix: "/features/", slugs: FEATURE_SLUGS },
  { prefix: "/solutions/", slugs: SOLUTION_SLUGS },
  { prefix: "/templates/", slugs: TEMPLATE_SLUGS },
  { prefix: "/use-cases/", slugs: USE_CASE_SLUGS },
  { prefix: "/industries/", slugs: INDUSTRY_SLUGS },
  { prefix: "/docs/", slugs: DOC_SLUGS },
];

/**
 * True when pathname is a public dynamic slug route with an unknown segment.
 * Hub paths (`/features`, `/docs`) are not treated as unknown.
 */
export function isUnknownPublicDynamicSlugPath(pathname: string): boolean {
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  for (const { prefix, slugs } of DYNAMIC_PREFIXES) {
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    if (!rest || rest.includes("/")) {
      // Nested unknown paths under these prefixes are not valid public pages.
      return Boolean(rest);
    }
    return !slugs.has(rest);
  }

  return false;
}

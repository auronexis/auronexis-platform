/**
 * Editorial "last updated" dates for public pages, used as <lastmod> in the sitemap.
 *
 * Google only trusts lastmod when it is consistently accurate, so these are real
 * content-change dates (from the git history of the content sources), never `new Date()`.
 * When you change the copy of a page or section, update its date here in the same PR.
 *
 * Rules are checked top to bottom; the first matching rule wins.
 */
type ContentDateRule = { match: (route: string) => boolean; date: string };

const exact = (...routes: string[]) => (route: string) => routes.includes(route);
const prefix = (...prefixes: string[]) => (route: string) =>
  prefixes.some((p) => route === p || route.startsWith(`${p}/`));

export const CONTENT_DATE_RULES: readonly ContentDateRule[] = [
  // Data processing agreement and sub-processor inventory — legal documents with their own history.
  { match: exact("/data-processing-agreement"), date: "2026-08-30" },
  { match: exact("/subprocessors"), date: "2026-10-27" },
  { match: exact("/careers"), date: "2026-07-12" },
  { match: exact("/status"), date: "2026-10-15" },
  // Terms, privacy and other legal pages — legal-content.ts last changed 2026-10-27.
  {
    match: exact("/terms", "/privacy", "/cookies", "/imprint", "/refund-policy", "/acceptable-use", "/security-policy"),
    date: "2026-10-27",
  },
  // Long-form guides — keep in sync with `updated` in guides-content.ts. The hub uses the
  // newest guide date; guides added later get their own exact rule above the prefix rule.
  { match: exact("/guides", "/guides/customer-health-score"), date: "2026-10-28" },
  { match: prefix("/guides"), date: "2026-10-23" },
  // Templates rewritten with examples and CSV downloads; retitled feature/solution pages.
  {
    match: (route: string) =>
      route === "/templates" ||
      route.startsWith("/templates/") ||
      [
        "/features/profitability",
        "/features/client-portal",
        "/features/executive-dashboards",
        "/solutions/sla-management",
        "/solutions/executive-dashboard",
        "/solutions/customer-health-score",
      ].includes(route),
    date: "2026-10-28",
  },
  // Marketing, landing, industry and docs pages — SEO copy and positioning update 2026-10-21.
  {
    match: prefix(
      "/features",
      "/solutions",
      "/industries",
      "/use-cases",
      "/templates",
      "/docs",
      "/security",
      "/pricing",
      "/integrations",
      "/enterprise",
      "/compliance",
      "/resources",
    ),
    date: "2026-10-21",
  },
  { match: exact("/", "/about", "/contact", "/faq", "/help", "/support", "/pilot-program"), date: "2026-10-21" },
];

/** Fallback for any public route without a specific rule. */
export const DEFAULT_CONTENT_DATE = "2026-10-20";

export function contentLastModified(route: string): string {
  const rule = CONTENT_DATE_RULES.find((r) => r.match(route));
  return rule?.date ?? DEFAULT_CONTENT_DATE;
}

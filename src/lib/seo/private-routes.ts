/**
 * Authenticated and internal route prefixes excluded from crawling and indexing.
 * Keep aligned with robots.txt disallow rules.
 * Lightweight module — safe to import from Edge middleware.
 */
export const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard",
  "/settings",
  "/client-portal",
  "/api/",
  "/webhooks",
  "/sales",
  "/invite",
  "/profile",
  "/clients",
  "/reports",
  "/incidents",
  "/risks",
  "/automation",
  "/monitoring",
  "/predictive",
  "/profitability",
  "/knowledge",
  "/notifications",
  "/activity",
  "/onboarding",
  "/copilot",
  "/intelligence",
  "/customer-success",
  "/adoption",
  "/billing",
  "/invoices",
  "/team",
] as const;

/**
 * Routes that must not be indexed (auth flows, password reset).
 * Authenticated app surfaces use PRIVATE_ROUTE_PREFIXES + layout noindex.
 */
export const NOINDEX_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

/** True when a path belongs to a private authenticated or internal surface. */
export function isPrivateRoute(path: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix),
  );
}

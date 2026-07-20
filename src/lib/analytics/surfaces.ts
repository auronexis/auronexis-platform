/** Resolve analytics surface tags for page views — public vs authenticated app. */

const APP_PATH_PREFIXES = [
  "/dashboard",
  "/clients",
  "/reports",
  "/risks",
  "/incidents",
  "/settings",
  "/profile",
  "/notifications",
  "/sales",
  "/knowledge",
  "/automation",
  "/monitoring",
  "/onboarding",
  "/activity",
  "/adoption",
  "/copilot",
  "/customer-success",
  "/intelligence",
  "/predictive",
  "/profitability",
  "/client-portal",
] as const;

export function resolvePageViewSurface(pathname: string): "public" | "app" | "portal" {
  if (pathname.startsWith("/client-portal")) return "portal";
  if (APP_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return "app";
  }
  return "public";
}

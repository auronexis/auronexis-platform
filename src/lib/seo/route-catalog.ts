/**
 * Build Bible V2 Chapter 8 — route classification for indexing policy.
 * Only Public Website routes may be indexed. All other categories stay private.
 */

export const ROUTE_CATEGORIES = [
  "public_website",
  "authentication",
  "dashboard",
  "portal",
  "settings",
  "api",
  "static_asset",
  "internal",
] as const;

export type RouteCategory = (typeof ROUTE_CATEGORIES)[number];

/** Prefixes (and exact paths) classified as non-marketing surfaces. */
const CATEGORY_PREFIXES: ReadonlyArray<{ category: RouteCategory; prefixes: readonly string[] }> = [
  {
    category: "api",
    prefixes: ["/api/", "/api", "/webhooks"],
  },
  {
    category: "authentication",
    prefixes: ["/login", "/signup", "/forgot-password", "/reset-password", "/auth", "/invite"],
  },
  {
    category: "portal",
    prefixes: ["/client-portal"],
  },
  {
    category: "settings",
    prefixes: ["/settings", "/profile", "/billing", "/invoices", "/team"],
  },
  {
    category: "dashboard",
    prefixes: [
      "/dashboard",
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
      "/sales",
    ],
  },
  {
    category: "static_asset",
    prefixes: [
      "/_next",
      "/branding",
      "/favicon.ico",
      "/favicon.svg",
      "/manifest.webmanifest",
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/apple-icon",
      "/icon-",
    ],
  },
  {
    category: "internal",
    prefixes: ["/legal"],
  },
];

function matchesPrefix(path: string, prefix: string): boolean {
  if (prefix.endsWith("/")) {
    return path === prefix.slice(0, -1) || path.startsWith(prefix);
  }
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Classify a pathname for SEO indexing policy. */
export function classifyRoute(pathname: string): RouteCategory {
  const path = pathname.split("?")[0] || "/";

  for (const entry of CATEGORY_PREFIXES) {
    if (entry.prefixes.some((prefix) => matchesPrefix(path, prefix))) {
      return entry.category;
    }
  }

  return "public_website";
}

/** True when the path is allowed to be indexed on the public marketing host. */
export function isIndexablePublicRoute(pathname: string): boolean {
  return classifyRoute(pathname) === "public_website";
}

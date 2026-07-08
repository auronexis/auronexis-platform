import { PRODUCTION_DOMAINS } from "@/lib/deployment/production-domains";

export type DomainRole = "marketing" | "app" | "staging" | "local" | "preview" | "unknown";

/** Marketing paths that must stay public on auroranexis.com / www (no auth redirect). */
export const REQUIRED_PUBLIC_MARKETING_PATHS = [
  "/",
  "/pricing",
  "/pilot-program",
  "/features",
  "/use-cases",
  "/security",
  "/documentation",
  "/contact",
  "/support",
  "/help",
  "/imprint",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0]?.trim() ?? "";
}

export function resolveDomainRole(hostname: string): DomainRole {
  const host = normalizeHostname(hostname);
  if (!host || host === "localhost" || host === "127.0.0.1") {
    return "local";
  }
  if (host === PRODUCTION_DOMAINS.app) {
    return "app";
  }
  if (host === PRODUCTION_DOMAINS.staging) {
    return "staging";
  }
  if (host === PRODUCTION_DOMAINS.apex || host === PRODUCTION_DOMAINS.www) {
    return "marketing";
  }
  if (host.endsWith(".vercel.app")) {
    return "preview";
  }
  return "unknown";
}

export function isMarketingHost(hostname: string): boolean {
  return resolveDomainRole(hostname) === "marketing";
}

export function isAppHost(hostname: string): boolean {
  const role = resolveDomainRole(hostname);
  return role === "app" || role === "staging";
}

export function isMarketingPublicPath(pathname: string): boolean {
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/legal/") ||
    pathname.startsWith("/docs/") ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/solutions/") ||
    pathname.startsWith("/templates/")
  ) {
    return true;
  }

  return REQUIRED_PUBLIC_MARKETING_PATHS.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );
}

export function isAuthPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth")
  );
}

export function isPortalLoginPath(pathname: string): boolean {
  return pathname === "/client-portal/login";
}

export function shouldSkipAuthRedirect(hostname: string, pathname: string): boolean {
  if (isAuthPath(pathname) || isPortalLoginPath(pathname)) {
    return true;
  }

  const role = resolveDomainRole(hostname);
  if (role === "marketing" || role === "local" || role === "preview" || role === "unknown") {
    return isMarketingPublicPath(pathname);
  }

  return false;
}

/**
 * Application code must not redirect between apex and www — Vercel domain settings
 * own that hop. A second redirect here caused ERR_TOO_MANY_REDIRECTS in production.
 */
export function hasConflictingHostnameRedirectRules(): boolean {
  return false;
}

export function wouldCauseHostnameRedirectLoop(
  rules: ReadonlyArray<{ fromHost: string; toHost: string }>,
): boolean {
  const graph = new Map<string, string>();
  for (const rule of rules) {
    graph.set(normalizeHostname(rule.fromHost), normalizeHostname(rule.toHost));
  }

  for (const start of graph.keys()) {
    const visited = new Set<string>();
    let current: string | undefined = start;
    while (current && graph.has(current)) {
      if (visited.has(current)) {
        return true;
      }
      visited.add(current);
      current = graph.get(current);
    }
  }

  return false;
}

export function buildAppLoginUrl(requestUrl: URL, pathname: string): URL {
  const loginUrl = new URL(requestUrl.toString());
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", pathname);
  return loginUrl;
}

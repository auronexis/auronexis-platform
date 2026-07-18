import { PRODUCTION_DOMAINS } from "@/lib/deployment/production-domains";
import {
  isAppHost,
  isAuthPath,
  isPortalLoginPath,
  normalizeHostname,
  resolveDomainRole,
} from "@/lib/deployment/domain-routing";
import { isPrivateRoute } from "@/lib/seo/private-routes";

/** API routes must never pass through auth redirects or marketing hostname hops. */
export function isApiRoute(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function isPaddleWebhookRoute(pathname: string): boolean {
  return pathname === "/api/paddle/webhook" || pathname.startsWith("/api/paddle/");
}

export function isInboundWebhookRoute(pathname: string): boolean {
  return (
    isPaddleWebhookRoute(pathname) ||
    pathname === "/api/webhooks" ||
    pathname.startsWith("/api/webhooks/")
  );
}

/** Static assets and metadata routes that must never redirect to login. */
export function isStaticPublicAssetPath(pathname: string): boolean {
  return (
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg"
  );
}

export function shouldBypassSessionMiddleware(pathname: string): boolean {
  return isApiRoute(pathname) || isStaticPublicAssetPath(pathname);
}

/**
 * Marketing apex → www redirect for HTML/marketing traffic only.
 * API routes stay on the requested host so Paddle and other POST webhooks never get 308.
 *
 * Requires removing the blanket apex redirect in Vercel Domains — use vercel.json redirects instead.
 */
export function shouldRedirectApexToWww(hostname: string, pathname: string): boolean {
  if (isApiRoute(pathname)) {
    return false;
  }

  return normalizeHostname(hostname) === PRODUCTION_DOMAINS.apex;
}

export function buildWwwRedirectUrl(requestUrl: URL): URL {
  const destination = new URL(requestUrl.toString());
  destination.hostname = PRODUCTION_DOMAINS.www;
  destination.protocol = "https:";
  return destination;
}

/**
 * Paths that belong on the application host (auth, invite, portal, workspace).
 * Everything else on app.* is marketing and must redirect to www to avoid SEO competition.
 */
export function isAppServablePath(pathname: string): boolean {
  return (
    isAuthPath(pathname) ||
    isPortalLoginPath(pathname) ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/client-portal") ||
    isPrivateRoute(pathname)
  );
}

/**
 * Production app host only — marketing/public paths must never be served from app.*.
 * Staging is excluded so it never redirects users into production www.
 */
export function shouldRedirectAppMarketingToWww(hostname: string, pathname: string): boolean {
  if (isApiRoute(pathname)) {
    return false;
  }

  if (resolveDomainRole(hostname) !== "app") {
    return false;
  }

  return !isAppServablePath(pathname);
}

/** Apply X-Robots-Tag so app/staging hosts never enter the marketing index. */
export function shouldAttachAppNoIndexHeader(hostname: string): boolean {
  return isAppHost(hostname);
}

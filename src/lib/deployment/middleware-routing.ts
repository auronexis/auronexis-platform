import { PRODUCTION_DOMAINS } from "@/lib/deployment/production-domains";
import { normalizeHostname } from "@/lib/deployment/domain-routing";

/** API routes must never pass through auth redirects or marketing hostname hops. */
export function isApiRoute(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export function isStripeWebhookRoute(pathname: string): boolean {
  return (
    pathname === "/api/stripe/webhook" ||
    pathname === "/api/stripe/webhook-v2" ||
    pathname.startsWith("/api/stripe/")
  );
}

export function isInboundWebhookRoute(pathname: string): boolean {
  return (
    isStripeWebhookRoute(pathname) ||
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
 * API routes stay on the requested host so Stripe and other POST webhooks never get 308.
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

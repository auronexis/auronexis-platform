import { PRODUCTION_DOMAINS } from "@/lib/deployment/production-domains";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";

/** Public marketing canonical host — www in production. */
export const PUBLIC_CANONICAL_ORIGIN = `https://${PRODUCTION_DOMAINS.www}`;

export const COMPANY_SEO = {
  productName: COMPANY_INFORMATION.productName,
  companyName: COMPANY_INFORMATION.legalName,
  /** @deprecated Use resolveCanonicalBaseUrl() — kept for backward-compatible imports. */
  canonicalBaseUrl: PUBLIC_CANONICAL_ORIGIN,
  defaultTitle: COMPANY_INFORMATION.productName,
  defaultDescription: COMPANY_INFORMATION.shortDescription,
  openGraph: {
    type: "website" as const,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image" as const,
  },
} as const;

export type CompanySeo = typeof COMPANY_SEO;

/**
 * Resolve the canonical public marketing origin.
 * Marketing pages always canonicalize to www, even when served from app.*.
 */
export function resolveCanonicalBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (raw) {
    try {
      const host = new URL(raw).hostname.toLowerCase();
      if (/localhost|127\.0\.0\.1|\.vercel\.app$/i.test(host) || host.endsWith(".vercel.app")) {
        return PUBLIC_CANONICAL_ORIGIN;
      }
      if (host === PRODUCTION_DOMAINS.app || host === PRODUCTION_DOMAINS.www || host === PRODUCTION_DOMAINS.apex) {
        return PUBLIC_CANONICAL_ORIGIN;
      }
    } catch {
      // fall through to public canonical
    }
  }

  return PUBLIC_CANONICAL_ORIGIN;
}

export function getCanonicalUrl(path: string): URL {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, resolveCanonicalBaseUrl());
}

export function getPageTitle(pageTitle: string): string {
  return `${pageTitle} | ${COMPANY_SEO.productName}`;
}

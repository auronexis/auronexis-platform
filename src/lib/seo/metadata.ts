import type { Metadata } from "next";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { COMPANY_SEO, getCanonicalUrl, getPageTitle } from "@/lib/company";
import { NOINDEX_ROUTES, PAGE_SEO } from "@/lib/seo/routes";

export type PageMetadataInput = {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
  keywords?: string[];
};

/** Resolve metadataBase — production URL or canonical fallback for previews. */
export function resolveMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw || /localhost|127\.0\.0\.1|\.vercel\.app/i.test(raw)) {
    return new URL(COMPANY_SEO.canonicalBaseUrl);
  }
  return new URL(raw);
}

const DEFAULT_KEYWORDS = [
  "B2B SaaS",
  "client intelligence",
  "risk management",
  "incident management",
  "SLA management",
  "executive reporting",
  "operations platform",
  "MSP software",
  "agency operations",
] as const;

/** Resolve whether a path should be excluded from search indexing. */
export function shouldNoIndex(path: string): boolean {
  return (NOINDEX_ROUTES as readonly string[]).includes(path);
}

/** Site verification tags for Google Search Console and Bing Webmaster Tools. */
export function getSiteVerificationMetadata(): Pick<Metadata, "verification" | "other"> {
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();

  const metadata: Pick<Metadata, "verification" | "other"> = {};

  if (google) {
    metadata.verification = { google };
  }

  if (bing) {
    metadata.other = { "msvalidate.01": bing };
  }

  return metadata;
}

/** Canonical metadata builder for public marketing, legal, and docs pages. */
export function createPageMetadata({
  title,
  description = COMPANY_SEO.defaultDescription,
  path,
  noIndex,
  keywords,
}: PageMetadataInput): Metadata {
  const url = getCanonicalUrl(path);
  const indexable = !(noIndex ?? shouldNoIndex(path));

  return {
    title,
    description,
    metadataBase: resolveMetadataBase(),
    applicationName: PLATFORM_NAME,
    creator: COMPANY_INFORMATION.legalName,
    publisher: COMPANY_INFORMATION.legalName,
    keywords: keywords ?? [...DEFAULT_KEYWORDS],
    alternates: { canonical: url.pathname },
    openGraph: {
      type: COMPANY_SEO.openGraph.type,
      locale: COMPANY_SEO.openGraph.locale,
      siteName: COMPANY_SEO.productName,
      title: getPageTitle(title),
      description,
      url: url.toString(),
      images: [
        {
          url: BRANDING_ASSETS.openGraph,
          width: 1200,
          height: 630,
          alt: `${COMPANY_SEO.productName} — ${title}`,
        },
      ],
    },
    twitter: {
      card: COMPANY_SEO.twitter.card,
      title: getPageTitle(title),
      description,
      images: [BRANDING_ASSETS.linkedinBanner],
    },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

/** Build metadata from the centralized PAGE_SEO registry when available. */
export function createPageMetadataForPath(path: string, overrides?: Partial<PageMetadataInput>): Metadata {
  const registry = PAGE_SEO[path];
  return createPageMetadata({
    title: overrides?.title ?? registry?.title ?? COMPANY_SEO.defaultTitle,
    description: overrides?.description ?? registry?.description ?? COMPANY_SEO.defaultDescription,
    path,
    noIndex: overrides?.noIndex,
    keywords: overrides?.keywords,
  });
}

/** Resolve the canonical site base URL for sitemap and robots. */
export function getSeoBaseUrl(): string {
  return COMPANY_SEO.canonicalBaseUrl;
}

import type { Metadata } from "next";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { COMPANY_SEO, getCanonicalUrl, getPageTitle } from "@/lib/company";
import { NOINDEX_ROUTES } from "@/lib/seo/routes";

export type PageMetadataInput = {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
};

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
}: PageMetadataInput): Metadata {
  const url = getCanonicalUrl(path);
  const indexable = !(noIndex ?? shouldNoIndex(path));

  return {
    title,
    description,
    metadataBase: new URL(COMPANY_SEO.canonicalBaseUrl),
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

/** Resolve the canonical site base URL for sitemap and robots. */
export function getSeoBaseUrl(): string {
  return COMPANY_SEO.canonicalBaseUrl;
}

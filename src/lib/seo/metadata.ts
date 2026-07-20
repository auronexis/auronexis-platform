import type { Metadata } from "next";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import {
  COMPANY_SEO,
  getCanonicalUrl,
  getPageTitle,
  resolveCanonicalBaseUrl,
} from "@/lib/company";
import { isPrivateRoute } from "@/lib/seo/private-routes";
import { NOINDEX_ROUTES, PAGE_SEO } from "@/lib/seo/routes";

export type PageMetadataInput = {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
  keywords?: string[];
};

/** True when running on preview, localhost, staging, or Vercel preview URLs. */
export function isPreviewDeployment(): boolean {
  if (process.env.VERCEL_ENV === "preview") {
    return true;
  }

  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) {
    return process.env.NODE_ENV !== "production";
  }

  return /localhost|127\.0\.0\.1|\.vercel\.app|staging\.auroranexis\.com/i.test(raw);
}

/** Resolve metadataBase — public marketing canonical host (www). */
export function resolveMetadataBase(): URL {
  return new URL(resolveCanonicalBaseUrl());
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
  return (
    (NOINDEX_ROUTES as readonly string[]).includes(path) ||
    isPrivateRoute(path) ||
    isPreviewDeployment()
  );
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

function resolveOpenGraphImageUrl(): string {
  return new URL(BRANDING_ASSETS.openGraph, resolveMetadataBase()).toString();
}

/** Same 1200×630 asset as Open Graph — consistent link previews across Google/Bing/X. */
function resolveTwitterImageUrl(): string {
  return resolveOpenGraphImageUrl();
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
    authors: [{ name: COMPANY_INFORMATION.legalName }],
    creator: COMPANY_INFORMATION.legalName,
    publisher: COMPANY_INFORMATION.legalName,
    category: "technology",
    keywords: keywords ?? [...DEFAULT_KEYWORDS],
    alternates: {
      canonical: url.toString(),
      languages: {
        en: url.toString(),
        "x-default": url.toString(),
      },
    },
    openGraph: {
      type: COMPANY_SEO.openGraph.type,
      locale: COMPANY_SEO.openGraph.locale,
      siteName: COMPANY_SEO.productName,
      title: getPageTitle(title),
      description,
      url: url.toString(),
      images: [
        {
          url: resolveOpenGraphImageUrl(),
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
      images: [resolveTwitterImageUrl()],
    },
    robots: indexable
      ? { index: true, follow: true }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false, noimageindex: true },
        },
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

/** Metadata for authenticated application surfaces — always noindex. */
export function createPrivateAppMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

/** Resolve the canonical site base URL for sitemap and robots. */
export function getSeoBaseUrl(): string {
  return resolveCanonicalBaseUrl();
}

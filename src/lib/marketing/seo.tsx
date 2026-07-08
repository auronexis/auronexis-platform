import type { Metadata } from "next";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { COMPANY_CONTACT, COMPANY_SEO, getCanonicalUrl, getPageTitle } from "@/lib/company";
import {
  faqJsonLd,
  organizationJsonLd,
  pilotProgramJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/company/company-schema";

type MarketingMetadataInput = {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
};

export function createMarketingMetadata({
  title,
  description = COMPANY_SEO.defaultDescription,
  path,
  noIndex = false,
}: MarketingMetadataInput): Metadata {
  const url = getCanonicalUrl(path);

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
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export { faqJsonLd, organizationJsonLd, pilotProgramJsonLd, softwareApplicationJsonLd, websiteJsonLd };

export function JsonLdScript({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization contact for metadata or support surfaces. */
export const MARKETING_SUPPORT_EMAIL = COMPANY_CONTACT.supportEmail;

import type { Metadata } from "next";
import { COMPANY_CONTACT } from "@/lib/company";
import { createPageMetadataForPath } from "@/lib/seo/metadata";

type MarketingMetadataInput = {
  title?: string;
  description?: string;
  path: string;
  noIndex?: boolean;
};

/** @deprecated Use createPageMetadataForPath from @/lib/seo — kept for backward compatibility. */
export function createMarketingMetadata(input: MarketingMetadataInput): Metadata {
  return createPageMetadataForPath(input.path, {
    title: input.title,
    description: input.description,
    noIndex: input.noIndex,
  });
}

export {
  articleJsonLd,
  breadcrumbJsonLd,
  enterpriseOfferJsonLd,
  faqJsonLd,
  organizationJsonLd,
  pilotProgramJsonLd,
  pricingPageJsonLd,
  softwareApplicationJsonLd,
  techArticleJsonLd,
  websiteJsonLd,
} from "@/lib/seo/structured-data";

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

import type { Metadata } from "next";
import { COMPANY_CONTACT } from "@/lib/company";
import { createPageMetadata } from "@/lib/seo/metadata";

type MarketingMetadataInput = {
  title: string;
  description?: string;
  path: string;
  noIndex?: boolean;
};

/** @deprecated Use createPageMetadata from @/lib/seo — kept for backward compatibility. */
export function createMarketingMetadata(input: MarketingMetadataInput): Metadata {
  return createPageMetadata(input);
}

export {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  pilotProgramJsonLd,
  softwareApplicationJsonLd,
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

import { COMPANY_CONTACT } from "@/lib/company";

export {
  aboutPageJsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
  contactPageJsonLd,
  enterpriseOfferJsonLd,
  faqJsonLd,
  organizationJsonLd,
  pilotProgramJsonLd,
  pricingPageJsonLd,
  softwareApplicationJsonLd,
  techArticleJsonLd,
  webPageJsonLd,
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

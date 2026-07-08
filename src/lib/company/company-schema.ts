import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { COMPANY_CONTACT } from "@/lib/company/company-contact";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { COMPANY_SEO } from "@/lib/company/company-seo";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY_INFORMATION.legalName,
    legalName: COMPANY_INFORMATION.legalName,
    url: COMPANY_SEO.canonicalBaseUrl,
    logo: new URL(BRANDING_ASSETS.approvedCompositeLogo, COMPANY_SEO.canonicalBaseUrl).toString(),
    email: COMPANY_CONTACT.supportEmail,
    telephone: COMPANY_CONTACT.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY_INFORMATION.street,
      postalCode: COMPANY_INFORMATION.postalCode,
      addressLocality: COMPANY_INFORMATION.city,
      addressCountry: "DE",
    },
    vatID: COMPANY_INFORMATION.vatId,
    founder: {
      "@type": "Person",
      name: COMPANY_INFORMATION.owner,
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: COMPANY_INFORMATION.productName,
    url: COMPANY_SEO.canonicalBaseUrl,
    publisher: {
      "@type": "Organization",
      name: COMPANY_INFORMATION.legalName,
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: COMPANY_INFORMATION.productName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: COMPANY_INFORMATION.shortDescription,
    offers: {
      "@type": "Offer",
      price: "149",
      priceCurrency: "EUR",
    },
    provider: {
      "@type": "Organization",
      name: COMPANY_INFORMATION.legalName,
      url: COMPANY_SEO.canonicalBaseUrl,
    },
  };
}

export function faqJsonLd(items: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function pilotProgramJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: "Auroranexis Pilot Partner Program",
    description: "Invite-only Pilot Partner program for qualified MSPs and agencies.",
    category: "Pilot Program",
    eligibleCustomerType: "Business",
    seller: {
      "@type": "Organization",
      name: COMPANY_INFORMATION.legalName,
    },
  };
}

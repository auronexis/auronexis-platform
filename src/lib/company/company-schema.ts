import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { COMPANY_CONTACT } from "@/lib/company/company-contact";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { getCanonicalUrl, resolveCanonicalBaseUrl } from "@/lib/company/company-seo";
import {
  PUBLIC_SELF_SERVE_PLAN_KEYS,
  getPlanByKey,
} from "@/lib/billing/plans";
import {
  GRAPH_ENTITY_IDS,
  capabilityKnowsAbout,
  pageEntityId,
} from "@/lib/seo/entity-graph";

function absoluteAsset(path: string): string {
  return new URL(path, resolveCanonicalBaseUrl()).toString();
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": GRAPH_ENTITY_IDS.organization,
    name: COMPANY_INFORMATION.legalName,
    legalName: COMPANY_INFORMATION.legalName,
    url: resolveCanonicalBaseUrl(),
    logo: absoluteAsset(BRANDING_ASSETS.approvedCompositeLogo),
    email: COMPANY_CONTACT.supportEmail,
    telephone: COMPANY_CONTACT.phone,
    knowsAbout: capabilityKnowsAbout(),
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
    "@id": GRAPH_ENTITY_IDS.website,
    name: COMPANY_INFORMATION.productName,
    url: resolveCanonicalBaseUrl(),
    publisher: { "@id": GRAPH_ENTITY_IDS.organization },
    inLanguage: "en",
  };
}

function buildPlanOffers() {
  const pricingUrl = getCanonicalUrl("/pricing").toString();

  return PUBLIC_SELF_SERVE_PLAN_KEYS.map((planKey) => {
    const plan = getPlanByKey(planKey);
    return {
      "@type": "Offer",
      name: plan.name,
      price: String(plan.priceMonthly),
      priceCurrency: plan.currency,
      availability: "https://schema.org/InStock",
      url: pricingUrl,
      description: plan.description,
    };
  });
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": GRAPH_ENTITY_IDS.softwareApplication,
    name: COMPANY_INFORMATION.productName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: COMPANY_INFORMATION.shortDescription,
    featureList: capabilityKnowsAbout(),
    offers: buildPlanOffers(),
    provider: { "@id": GRAPH_ENTITY_IDS.organization },
  };
}

/** Product schema for the public pricing page — matches live self-serve plan prices. */
export function pricingPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": GRAPH_ENTITY_IDS.product,
    name: COMPANY_INFORMATION.productName,
    description: COMPANY_INFORMATION.shortDescription,
    brand: {
      "@type": "Brand",
      name: COMPANY_INFORMATION.productName,
    },
    offers: buildPlanOffers(),
    isRelatedTo: { "@id": GRAPH_ENTITY_IDS.softwareApplication },
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

export function enterpriseOfferJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": pageEntityId("/enterprise"),
    name: `${COMPANY_INFORMATION.productName} Enterprise`,
    description:
      "Enterprise client operations platform with unlimited AI credits, custom limits, priority support, and advanced security controls.",
    url: getCanonicalUrl("/enterprise").toString(),
    provider: { "@id": GRAPH_ENTITY_IDS.organization },
    areaServed: "Worldwide",
    audience: {
      "@type": "BusinessAudience",
      audienceType: "MSPs, IT consultancies, and multi-client service organizations",
    },
  };
}

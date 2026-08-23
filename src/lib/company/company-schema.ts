import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { COMPANY_CONTACT } from "@/lib/company/company-contact";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { APP_VERSION, LEGAL_ROUTES, MARKETING_ROUTES } from "@/lib/company/company-links";
import { getCanonicalUrl, resolveCanonicalBaseUrl } from "@/lib/company/company-seo";
import {
  PUBLIC_SELF_SERVE_PLAN_KEYS,
  getPlanByKey,
  type PlanKey,
  type SubscriptionPlanDefinition,
} from "@/lib/billing/plans";
import {
  GRAPH_ENTITY_IDS,
  capabilityKnowsAbout,
  entityId,
  pageEntityId,
} from "@/lib/seo/entity-graph";

function absoluteAsset(path: string): string {
  return new URL(path, resolveCanonicalBaseUrl()).toString();
}

const PRICING_URL = () => getCanonicalUrl(MARKETING_ROUTES.pricing).toString();
const REFUND_POLICY_URL = () => getCanonicalUrl(LEGAL_ROUTES.refundPolicy).toString();
const HOME_URL = () => resolveCanonicalBaseUrl();

/** Stable @id for the organization-level return policy (facts from /refund-policy). */
export const MERCHANT_RETURN_POLICY_ID = entityId("#merchant-return-policy");

/**
 * Merchant return policy from the published Refund and Cancellation Policy.
 *
 * Verified facts only:
 * - Seller jurisdiction: DE
 * - Business customers: paid period generally non-refundable (MerchantReturnNotPermitted)
 * - Consumers retain mandatory statutory rights (stated on the policy page — not inventing a day window)
 * - No physical returns (digital SaaS)
 * - Policy URL is the public legal document
 *
 * Do NOT invent merchantReturnDays or mail-return methods.
 */
export function merchantReturnPolicyJsonLd() {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": MERCHANT_RETURN_POLICY_ID,
    name: "Auroranexis Refund and Cancellation Policy",
    url: REFUND_POLICY_URL(),
    merchantReturnLink: REFUND_POLICY_URL(),
    applicableCountry: "DE",
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "consumerRights",
        value:
          "Where a buyer qualifies as a consumer and mandatory consumer-protection law applies, statutory withdrawal and refund rights remain unaffected.",
      },
      {
        "@type": "PropertyValue",
        name: "paymentProcessing",
        value:
          "New self-serve purchases are processed via Mollie. See /refund-policy for cancellation and refund request handling.",
      },
    ],
  };
}

/**
 * Digital SaaS access has no physical shipment.
 * shippingRate 0 and 0-hour handling/transit represent immediate software access provisioning —
 * not invented carrier transit for physical goods.
 * Destination DE is the seller's country of establishment (organization address).
 */
export function digitalAccessShippingDetails(currency: string) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: 0,
      currency,
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 0,
        unitCode: "HUR",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 0,
        unitCode: "HUR",
      },
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "DE",
    },
  };
}

function contactPoints() {
  return [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: COMPANY_CONTACT.supportEmail,
      telephone: COMPANY_CONTACT.phone,
      areaServed: "Worldwide",
      availableLanguage: ["en", "de"],
    },
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: COMPANY_CONTACT.salesEmail,
      areaServed: "Worldwide",
      availableLanguage: ["en", "de"],
    },
    {
      "@type": "ContactPoint",
      contactType: "security",
      email: COMPANY_CONTACT.securityEmail,
      areaServed: "Worldwide",
      availableLanguage: ["en"],
    },
  ];
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": GRAPH_ENTITY_IDS.organization,
    name: COMPANY_INFORMATION.legalName,
    legalName: COMPANY_INFORMATION.legalName,
    alternateName: COMPANY_INFORMATION.productName,
    description: COMPANY_INFORMATION.shortDescription,
    url: HOME_URL(),
    logo: absoluteAsset(BRANDING_ASSETS.approvedCompositeLogo),
    image: absoluteAsset(BRANDING_ASSETS.openGraph),
    email: COMPANY_CONTACT.supportEmail,
    telephone: COMPANY_CONTACT.phone,
    knowsAbout: capabilityKnowsAbout(),
    brand: {
      "@type": "Brand",
      name: COMPANY_INFORMATION.productName,
      logo: absoluteAsset(BRANDING_ASSETS.approvedCompositeLogo),
    },
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
    contactPoint: contactPoints(),
    hasMerchantReturnPolicy: { "@id": MERCHANT_RETURN_POLICY_ID },
  };
}

/**
 * WebSite schema. Public site-search / sitelinks search box markup is intentionally omitted —
 * there is no public search endpoint on the marketing site.
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": GRAPH_ENTITY_IDS.website,
    name: COMPANY_INFORMATION.productName,
    alternateName: COMPANY_INFORMATION.legalName,
    url: HOME_URL(),
    description: COMPANY_INFORMATION.shortDescription,
    publisher: { "@id": GRAPH_ENTITY_IDS.organization },
    inLanguage: "en",
  };
}

function buildOfferForPlan(plan: SubscriptionPlanDefinition) {
  const pricingUrl = PRICING_URL();
  return {
    "@type": "Offer",
    "@id": entityId(`#offer-${plan.key}`),
    name: `${COMPANY_INFORMATION.productName} ${plan.name}`,
    description: plan.description,
    price: String(plan.priceMonthly),
    priceCurrency: plan.currency,
    availability: "https://schema.org/InStock",
    itemCondition: "https://schema.org/NewCondition",
    url: pricingUrl,
    category: "DigitalSubscription",
    seller: { "@id": GRAPH_ENTITY_IDS.organization },
    hasMerchantReturnPolicy: { "@id": MERCHANT_RETURN_POLICY_ID },
    shippingDetails: digitalAccessShippingDetails(plan.currency),
  };
}

function buildPlanOffers() {
  return PUBLIC_SELF_SERVE_PLAN_KEYS.map((planKey) => buildOfferForPlan(getPlanByKey(planKey)));
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": GRAPH_ENTITY_IDS.softwareApplication,
    name: COMPANY_INFORMATION.productName,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Operations Command Center",
    operatingSystem: "Web",
    softwareVersion: APP_VERSION,
    url: HOME_URL(),
    image: absoluteAsset(BRANDING_ASSETS.openGraph),
    description: COMPANY_INFORMATION.shortDescription,
    featureList: capabilityKnowsAbout(),
    offers: buildPlanOffers(),
    provider: { "@id": GRAPH_ENTITY_IDS.organization },
    brand: {
      "@type": "Brand",
      name: COMPANY_INFORMATION.productName,
    },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "MSPs, IT agencies, consultancies, and automation firms",
    },
  };
}

/** One Product node per public self-serve plan (Professional / Business / Enterprise). */
export function pricingPlanProductsJsonLd(): Record<string, unknown>[] {
  const pricingUrl = PRICING_URL();

  return PUBLIC_SELF_SERVE_PLAN_KEYS.map((planKey: (typeof PUBLIC_SELF_SERVE_PLAN_KEYS)[number]) => {
    const plan = getPlanByKey(planKey);
    return {
      "@type": "Product",
      "@id": entityId(`#product-${plan.key}`),
      name: `${COMPANY_INFORMATION.productName} ${plan.name}`,
      description: plan.description,
      category: "BusinessApplication",
      url: pricingUrl,
      image: absoluteAsset(BRANDING_ASSETS.openGraph),
      brand: {
        "@type": "Brand",
        name: COMPANY_INFORMATION.productName,
      },
      audience: {
        "@type": "BusinessAudience",
        audienceType: "MSPs, IT agencies, consultancies, and automation firms",
      },
      offers: buildOfferForPlan(plan),
      isRelatedTo: { "@id": GRAPH_ENTITY_IDS.softwareApplication },
      manufacturer: { "@id": GRAPH_ENTITY_IDS.organization },
    };
  });
}

/**
 * Aggregate Product for the pricing page graph (Offer catalog of public self-serve plans).
 * Private invite-only FastSpring programs remain excluded from public offer generation.
 */
export function pricingPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": GRAPH_ENTITY_IDS.product,
    name: COMPANY_INFORMATION.productName,
    description: COMPANY_INFORMATION.shortDescription,
    category: "BusinessApplication",
    url: PRICING_URL(),
    image: absoluteAsset(BRANDING_ASSETS.openGraph),
    brand: {
      "@type": "Brand",
      name: COMPANY_INFORMATION.productName,
    },
    offers: buildPlanOffers(),
    isRelatedTo: { "@id": GRAPH_ENTITY_IDS.softwareApplication },
  };
}

/** Deduplicate FAQ questions within a single FAQPage payload. */
export function faqJsonLd(items: ReadonlyArray<{ question: string; answer: string }>) {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = item.question.trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: unique.map((item) => ({
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
    url: getCanonicalUrl(MARKETING_ROUTES.pilotProgram).toString(),
    availability: "https://schema.org/LimitedAvailability",
    eligibleCustomerType: "Business",
    seller: { "@id": GRAPH_ENTITY_IDS.organization },
    hasMerchantReturnPolicy: { "@id": MERCHANT_RETURN_POLICY_ID },
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
    category: "BusinessApplication",
    audience: {
      "@type": "BusinessAudience",
      audienceType: "MSPs, IT consultancies, and multi-client service organizations",
    },
  };
}

/** Type guard helper for tests / callers that need plan product ids. */
export function productEntityIdForPlan(planKey: PlanKey): string {
  return entityId(`#product-${planKey}`);
}

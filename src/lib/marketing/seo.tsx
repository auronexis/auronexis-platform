import type { Metadata } from "next";
import { COMPANY_NAME } from "@/lib/company/contact";
import { BRANDING_ASSETS } from "@/lib/branding/assets";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://app.auroranexis.com",
);

type MarketingMetadataInput = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createMarketingMetadata({
  title,
  description,
  path,
  noIndex = false,
}: MarketingMetadataInput): Metadata {
  const url = new URL(path, metadataBase);

  return {
    title,
    description,
    alternates: { canonical: url.pathname },
    openGraph: {
      type: "website",
      siteName: COMPANY_NAME,
      title: `${title} | ${COMPANY_NAME}`,
      description,
      url: url.toString(),
      images: [
        {
          url: BRANDING_ASSETS.openGraph,
          width: 1200,
          height: 630,
          alt: `${COMPANY_NAME} — ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${COMPANY_NAME}`,
      description,
      images: [BRANDING_ASSETS.linkedinBanner],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY_NAME,
    url: metadataBase.toString(),
    logo: new URL(BRANDING_ASSETS.compositeLogoHorizontal, metadataBase).toString(),
    email: "info@auroranexis.com",
    sameAs: [],
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: COMPANY_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "49",
      priceCurrency: "EUR",
    },
    description:
      "Operations Command Center for AI automation agencies — monitor clients, detect risks, and prove value.",
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
    name: "Auroranexis Pilot Program",
    description: "6-week founding customer pilot with 50% beta pricing for MSPs and agencies.",
    category: "Pilot Program",
    eligibleCustomerType: "Business",
    seller: {
      "@type": "Organization",
      name: COMPANY_NAME,
    },
  };
}

export function JsonLdScript({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

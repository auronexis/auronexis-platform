import type { Metadata } from "next";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_SEO } from "@/lib/company/company-seo";

function resolveMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw || /localhost|127\.0\.0\.1|\.vercel\.app/i.test(raw)) {
    return new URL(COMPANY_SEO.canonicalBaseUrl);
  }

  return new URL(raw);
}

const metadataBase = resolveMetadataBase();

export const PLATFORM_METADATA: Metadata = {
  metadataBase,
  title: {
    default: PLATFORM_NAME,
    template: `%s | ${PLATFORM_NAME}`,
  },
  description: COMPANY_SEO.defaultDescription,
  icons: {
    icon: [{ url: BRANDING_ASSETS.favicon, type: "image/svg+xml" }],
    apple: [{ url: BRANDING_ASSETS.approvedCompositeLogo, type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: COMPANY_SEO.productName,
    title: PLATFORM_NAME,
    description: COMPANY_SEO.defaultDescription,
    images: [
      {
        url: BRANDING_ASSETS.openGraph,
        width: 1200,
        height: 630,
        alt: `${PLATFORM_NAME} — Operations Command Center`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PLATFORM_NAME,
    description: COMPANY_SEO.defaultDescription,
    images: [BRANDING_ASSETS.linkedinBanner],
  },
};

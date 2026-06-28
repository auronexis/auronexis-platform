import type { Metadata } from "next";
import { BRANDING_ASSETS } from "@/lib/branding/assets";
import { PLATFORM_NAME } from "@/lib/branding/defaults";

const SITE_DESCRIPTION =
  "The Operations Command Center for AI Automation Agencies. Monitor clients. Detect risks. Prove value.";

const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://app.auroranexis.com",
);

export const PLATFORM_METADATA: Metadata = {
  metadataBase,
  title: {
    default: PLATFORM_NAME,
    template: `%s | ${PLATFORM_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: BRANDING_ASSETS.favicon, type: "image/svg+xml" }],
    apple: [{ url: BRANDING_ASSETS.approvedCompositeLogo, type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: PLATFORM_NAME,
    title: PLATFORM_NAME,
    description: SITE_DESCRIPTION,
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
    description: SITE_DESCRIPTION,
    images: [BRANDING_ASSETS.linkedinBanner],
  },
};

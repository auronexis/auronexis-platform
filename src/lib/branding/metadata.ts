import type { Metadata, Viewport } from "next";
import { PLATFORM_NAME } from "@/lib/branding/defaults";
import {
  PLATFORM_BACKGROUND_COLOR,
  PLATFORM_ICONS,
  PLATFORM_THEME_COLOR,
} from "@/lib/branding/icons";
import { COMPANY_SEO } from "@/lib/company/company-seo";
import { getSiteVerificationMetadata } from "@/lib/seo/metadata";

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
  applicationName: PLATFORM_NAME,
  ...getSiteVerificationMetadata(),
  title: {
    default: PLATFORM_NAME,
    template: `%s | ${PLATFORM_NAME}`,
  },
  description: COMPANY_SEO.defaultDescription,
  keywords: [
    "B2B SaaS",
    "client intelligence",
    "risk management",
    "incident management",
    "SLA management",
    "executive reporting",
    "operations platform",
  ],
  icons: {
    icon: [
      { url: PLATFORM_ICONS.favicon, type: "image/svg+xml" },
      { url: PLATFORM_ICONS.pwaIcon512, type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: PLATFORM_ICONS.appleTouchIcon, type: "image/svg+xml" }],
    shortcut: [PLATFORM_ICONS.favicon],
  },
  appleWebApp: {
    capable: true,
    title: PLATFORM_NAME,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: COMPANY_SEO.productName,
    title: PLATFORM_NAME,
    description: COMPANY_SEO.defaultDescription,
    images: [
      {
        url: "/branding/opengraph-1200x630.png",
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
    images: ["/branding/linkedin-banner.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/** Browser chrome theme colors — Next.js 15 requires viewport export, not metadata. */
export const PLATFORM_VIEWPORT: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PLATFORM_THEME_COLOR },
    { media: "(prefers-color-scheme: dark)", color: PLATFORM_BACKGROUND_COLOR },
  ],
};

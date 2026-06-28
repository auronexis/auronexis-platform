/**
 * Canonical paths for platform branding assets in /public/branding.
 *
 * Inline UI branding uses AuroranexisWordmark (CSS text only).
 * Image assets here are for OpenGraph, metadata, email, and backgrounds only.
 */

export const BRANDING_ASSETS = {
  /** Metadata / social — not for inline UI wordmark surfaces. */
  approvedCompositeLogo: "/branding/logo-horizontal.png",

  loginBackground: "/branding/login-screen.png",
  favicon: "/favicon.svg",
  heroBanner: "/branding/hero-banner.png",
  splashScreen: "/branding/splash-screen.png",
  linkedinBanner: "/branding/linkedin-banner.png",
  openGraph: "/branding/opengraph-1200x630.png",
  profileFallback: "/branding/profile-800.png",
} as const;

export type BrandingAssetKey = keyof typeof BRANDING_ASSETS;

/** UI uses CSS wordmark — no inline image logo paths. */
export const INLINE_BRANDING_ASSETS = [] as const;

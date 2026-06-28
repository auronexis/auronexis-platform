/**
 * Canonical paths for platform branding assets in /public/branding.
 *
 * Official inline logo (UI): logo-horizontal.png only.
 * Decorative / social only: login-screen.png, hero-banner.png, opengraph, etc.
 */

export const BRANDING_ASSETS = {
  /** Official horizontal lockup — all public-facing UI (nav, login, loading, footer). */
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

/** Approved inline branding paths — logo-horizontal.png only. */
export const INLINE_BRANDING_ASSETS = [BRANDING_ASSETS.approvedCompositeLogo] as const;

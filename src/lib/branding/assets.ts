/**
 * Canonical paths for platform branding assets in /public/branding.
 *
 * Asset audit (background):
 * - Baked dark background (composite only — never inline UI):
 *   logo-horizontal.png, logo-light.png, logo-dark.png, icon-512.png
 * - Processed transparent PNGs (still raster — not for inline UI):
 *   logo-horizontal-transparent.png, logo-light-transparent.png,
 *   logo-dark-transparent.png, icon-512-transparent.png, logo-horizontal-on-light.png
 * - Transparent UI SVGs (inline logos only):
 *   auroranexis-logo-horizontal.svg, auroranexis-logo-light.svg, auroranexis-icon.svg
 * - Decorative / social composites only:
 *   hero-banner.png, login-screen.png, opengraph-1200x630.png, linkedin-banner.png,
 *   splash-screen.png, profile-800.png, favicon.png
 */

/** UI assets must be transparent SVGs. Composite PNGs are not allowed in UI. */
export const BRANDING_ASSETS = {
  uiLogoHorizontal: "/branding/auroranexis-logo-horizontal.svg",
  uiLogoLight: "/branding/auroranexis-logo-light.svg",
  uiIcon: "/branding/auroranexis-icon.svg",

  compositeLogoHorizontal: "/branding/logo-horizontal.png",
  compositeLogoLight: "/branding/logo-light.png",
  compositeLogoDark: "/branding/logo-dark.png",
  compositeIcon512: "/branding/icon-512.png",

  favicon: "/favicon.svg",
  heroBanner: "/branding/hero-banner.png",
  loginScreen: "/branding/login-screen.png",
  splashScreen: "/branding/splash-screen.png",
  linkedinBanner: "/branding/linkedin-banner.png",
  openGraph: "/branding/opengraph-1200x630.png",
  profileFallback: "/branding/profile-800.png",
} as const;

export type BrandingAssetKey = keyof typeof BRANDING_ASSETS;

/** Preload / inline UI logo paths — transparent SVGs only. */
export const INLINE_BRANDING_ASSETS = [
  BRANDING_ASSETS.uiLogoHorizontal,
  BRANDING_ASSETS.uiLogoLight,
  BRANDING_ASSETS.uiIcon,
] as const;

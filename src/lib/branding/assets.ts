/**
 * Canonical paths for platform branding assets in /public/branding.
 *
 * Do not use generated SVG logos. Use approved PNG composite only on dark surfaces;
 * use text-only on light surfaces if no transparent approved asset exists.
 *
 * Baked dark background (composite — dark surfaces only):
 *   logo-horizontal.png, logo-light.png, logo-dark.png, icon-512.png
 * Transparent approved raster (light-surface horizontal logos):
 *   logo-horizontal-transparent.png, logo-horizontal-on-light.png
 * Decorative / social only:
 *   login-screen.png, hero-banner.png, opengraph-1200x630.png, linkedin-banner.png, etc.
 */

export const BRANDING_ASSETS = {
  /** Full horizontal lockup — marketing nav, dark footer (black tile blends on dark bg). */
  approvedCompositeLogo: "/branding/logo-horizontal.png",
  /** Transparent horizontal lockup — login card and light-surface UI. */
  logoHorizontalTransparent: "/branding/logo-horizontal-transparent.png",
  logoHorizontalOnLight: "/branding/logo-horizontal-on-light.png",

  compositeLogoLight: "/branding/logo-light.png",
  compositeLogoDark: "/branding/logo-dark.png",
  compositeIcon512: "/branding/icon-512.png",

  loginBackground: "/branding/login-screen.png",
  favicon: "/favicon.svg",
  heroBanner: "/branding/hero-banner.png",
  splashScreen: "/branding/splash-screen.png",
  linkedinBanner: "/branding/linkedin-banner.png",
  openGraph: "/branding/opengraph-1200x630.png",
  profileFallback: "/branding/profile-800.png",
} as const;

export type BrandingAssetKey = keyof typeof BRANDING_ASSETS;

/** Approved inline branding paths — no generated SVG logos. */
export const INLINE_BRANDING_ASSETS = [
  BRANDING_ASSETS.approvedCompositeLogo,
  BRANDING_ASSETS.logoHorizontalTransparent,
  BRANDING_ASSETS.logoHorizontalOnLight,
  BRANDING_ASSETS.compositeIcon512,
] as const;

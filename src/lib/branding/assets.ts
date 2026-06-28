/**
 * Canonical paths for platform branding assets in /public/branding.
 *
 * Inline UI logos: logo-horizontal.png (default), logo-horizontal-transparent.png,
 * logo-light.png, logo-dark.png only.
 */

export const BRANDING_ASSETS = {
  /** Default platform logo — marketing, login, footer, loading, public pages. */
  logoHorizontal: "/branding/logo-horizontal.png",
  logoHorizontalTransparent: "/branding/logo-horizontal-transparent.png",
  logoLight: "/branding/logo-light.png",
  logoDark: "/branding/logo-dark.png",

  /** @deprecated Use logoHorizontal */
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

export const INLINE_BRANDING_ASSETS = [
  BRANDING_ASSETS.logoHorizontal,
  BRANDING_ASSETS.logoHorizontalTransparent,
  BRANDING_ASSETS.logoLight,
  BRANDING_ASSETS.logoDark,
] as const;

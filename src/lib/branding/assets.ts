/**
 * Canonical paths for platform branding assets in /public/branding.
 *
 * UI logos: logo-horizontal-transparent.png (dark surfaces),
 * logo-horizontal-on-light.png (light surfaces).
 * logo-horizontal.png is metadata/OpenGraph only — never inline UI.
 */

export const BRANDING_ASSETS = {
  /** Metadata / OpenGraph only — black background, not for inline UI. */
  logoHorizontal: "/branding/logo-horizontal.png",
  /** Metadata / manifest 512 — compact symbol (not full wordmark). */
  approvedCompositeLogo: "/icon-512-compact.png",

  /** Dark UI — navbar, footer, login left panel. */
  logoHorizontalTransparent: "/branding/logo-horizontal-transparent.png",
  /** Light UI — white login card, loading screen. */
  logoHorizontalOnLight: "/branding/logo-horizontal-on-light.png",

  logoLight: "/branding/logo-light.png",
  logoDark: "/branding/logo-dark.png",

  loginBackground: "/branding/login-screen.png",
  favicon: "/favicon.ico",
  faviconSvg: "/favicon.svg",
  appleTouchIcon: "/apple-icon.png",
  pwaIconCompact: "/icon-512-compact.png",
  heroBanner: "/branding/hero-banner.png",
  splashScreen: "/branding/splash-screen.png",
  linkedinBanner: "/branding/linkedin-banner.png",
  openGraph: "/branding/opengraph-1200x630.png",
  profileFallback: "/branding/profile-800.png",
} as const;

export type BrandingAssetKey = keyof typeof BRANDING_ASSETS;

export const INLINE_BRANDING_ASSETS = [
  BRANDING_ASSETS.logoHorizontalTransparent,
  BRANDING_ASSETS.logoHorizontalOnLight,
  BRANDING_ASSETS.logoLight,
  BRANDING_ASSETS.logoDark,
] as const;

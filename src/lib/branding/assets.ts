/** Canonical paths for platform branding assets in /public/branding. */

/** Inline UI logos — SVG with transparent backgrounds (production-safe). */
export const BRANDING_ASSETS = {
  /** Navy wordmark — light surfaces (marketing nav on white, auth card, legal). */
  logoHorizontal: "/branding/logo-horizontal.svg",
  /** White wordmark — dark surfaces (marketing header, docs hero). */
  logoLight: "/branding/logo-light.svg",
  logoDark: "/branding/logo-horizontal.svg",
  iconMark: "/branding/icon-mark.svg",
  icon512: "/branding/icon-mark.svg",
  favicon: "/favicon.svg",
  /** Original composite PNGs — OG, social, and email only (optional; generate via scripts). */
  logoHorizontalComposite: "/branding/logo-horizontal.png",
  logoLightComposite: "/branding/logo-light.png",
  logoDarkComposite: "/branding/logo-dark.png",
  icon512Composite: "/branding/icon-512.png",
  heroBanner: "/branding/hero-banner.png",
  loginScreen: "/branding/login-screen.png",
  /** Reserved for native/PWA splash — not used in in-app loading states. */
  splashScreen: "/branding/splash-screen.png",
  linkedinBanner: "/branding/linkedin-banner.png",
  openGraph: "/branding/opengraph-1200x630.png",
  profileFallback: "/branding/profile-800.png",
} as const;

export type BrandingAssetKey = keyof typeof BRANDING_ASSETS;

export const INLINE_BRANDING_ASSETS = [
  BRANDING_ASSETS.logoHorizontal,
  BRANDING_ASSETS.logoLight,
  BRANDING_ASSETS.iconMark,
] as const;

/** Canonical paths for platform branding assets in /public/branding. */

/** Transparent PNGs — full original lockups/marks for inline UI (no baked backgrounds). */
export const BRANDING_ASSETS = {
  /** Navy wordmark — light surfaces (marketing nav, auth card, legal). */
  logoHorizontal: "/branding/logo-horizontal-on-light.png",
  /** White wordmark — dark surfaces (docs hero, secondary bands). */
  logoLight: "/branding/logo-horizontal-transparent.png",
  logoDark: "/branding/logo-dark-transparent.png",
  iconMark: "/branding/icon-512-transparent.png",
  icon512: "/branding/icon-512-transparent.png",
  favicon: "/branding/favicon.png",
  /** Original composite PNGs — OG, social, and email only. */
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

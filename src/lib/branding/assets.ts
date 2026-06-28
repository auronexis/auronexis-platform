/** Canonical paths for platform branding assets in /public/branding. */

export const BRANDING_ASSETS = {
  /** Full horizontal lockup — marketing nav, auth card, light surfaces. */
  logoHorizontal: "/branding/logo-horizontal.png",
  /** Light wordmark — dark surfaces (login side panel). */
  logoLight: "/branding/logo-light.png",
  logoDark: "/branding/logo-dark.png",
  /** App icon mark — sidebar, portal, loading splash. */
  iconMark: "/branding/icon-512.png",
  icon512: "/branding/icon-512.png",
  favicon: "/favicon.svg",
  logoHorizontalComposite: "/branding/logo-horizontal.png",
  logoLightComposite: "/branding/logo-light.png",
  logoDarkComposite: "/branding/logo-dark.png",
  icon512Composite: "/branding/icon-512.png",
  heroBanner: "/branding/hero-banner.png",
  loginScreen: "/branding/login-screen.png",
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

import type { ResolvedWhiteLabelBranding } from "@/lib/white-label/types";

export function getPortalBrandingContext(branding: ResolvedWhiteLabelBranding) {
  return {
    title: branding.portalTitle,
    description: branding.portalDescription,
    welcomeMessage: branding.portalWelcomeMessage,
    logoUrl: branding.logoLightUrl ?? branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    footer: {
      supportEmail: branding.supportEmail,
      supportUrl: branding.supportUrl,
      privacyUrl: branding.privacyUrl,
      termsUrl: branding.termsUrl,
      website: branding.website,
    },
    theme: branding.themeTokens,
    hidePlatformBranding: branding.hidePlatformBranding,
  };
}

export function getLoginBrandingContext(branding: ResolvedWhiteLabelBranding) {
  return {
    title: branding.loginTitle,
    subtitle: branding.loginSubtitle,
    welcomeMessage: branding.loginWelcomeMessage,
    logoUrl: branding.logoLightUrl ?? branding.logoUrl,
    backgroundUrl: branding.loginBackgroundUrl,
    supportEmail: branding.supportEmail,
    supportUrl: branding.supportUrl,
    privacyUrl: branding.privacyUrl,
    termsUrl: branding.termsUrl,
    theme: branding.themeTokens,
  };
}

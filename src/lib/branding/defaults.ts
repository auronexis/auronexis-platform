import type { OrganizationBranding } from "@/types/database";
import { getPlatformBrandingDefaults } from "@/lib/branding/platform-defaults";

export const PLATFORM_NAME = "Auroranexis";

export const DEFAULT_PRIMARY_COLOR = "#2563EB";
export const DEFAULT_SECONDARY_COLOR = "#071A3D";

export const DEFAULT_PORTAL_WELCOME_MESSAGE =
  "Your operational status and reports in one place.";

export type ResolvedOrganizationBranding = {
  companyName: string;
  platformName?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  successColor?: string;
  warningColor?: string;
  dangerColor?: string;
  logoUrl: string | null;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  logoHorizontalUrl?: string | null;
  iconUrl?: string | null;
  faviconUrl?: string | null;
  loginBackgroundUrl?: string | null;
  dashboardBackgroundUrl?: string | null;
  portalWelcomeMessage: string;
  portalTitle?: string;
  portalDescription?: string | null;
  loginTitle?: string;
  loginSubtitle?: string | null;
  loginWelcomeMessage?: string | null;
  supportEmail?: string | null;
  supportUrl?: string | null;
  privacyUrl?: string | null;
  termsUrl?: string | null;
  emailSenderName?: string | null;
  emailSenderAddress?: string | null;
  pdfFooter?: string | null;
  customCss?: string | null;
  themeTokens?: import("@/lib/white-label/types").WhiteLabelThemeTokens;
  cssVariables?: string;
  hidePlatformBranding?: boolean;
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/** Resolve branding with organization defaults when no custom record exists. */
export function resolveOrganizationBranding(
  organizationName: string,
  branding: OrganizationBranding | null,
): ResolvedOrganizationBranding {
  const platform = getPlatformBrandingDefaults();
  const customLogo = branding?.logo_url?.trim() || null;

  return {
    companyName: branding?.company_name?.trim() || organizationName || PLATFORM_NAME,
    primaryColor: normalizeHexColor(branding?.primary_color, DEFAULT_PRIMARY_COLOR),
    secondaryColor: normalizeHexColor(branding?.secondary_color, DEFAULT_SECONDARY_COLOR),
    logoUrl: customLogo ?? platform.logoUrl,
    logoLightUrl: customLogo ?? platform.logoLightUrl,
    logoDarkUrl: platform.logoDarkUrl,
    logoHorizontalUrl: platform.logoHorizontalUrl,
    iconUrl: customLogo ?? platform.iconUrl,
    faviconUrl: platform.faviconUrl,
    loginBackgroundUrl: platform.loginBackgroundUrl,
    portalWelcomeMessage:
      branding?.portal_welcome_message?.trim() || DEFAULT_PORTAL_WELCOME_MESSAGE,
  };
}

export function normalizeHexColor(value: string | null | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const normalized = value.startsWith("#") ? value : `#${value}`;

  return HEX_COLOR_PATTERN.test(normalized) ? normalized.toUpperCase() : fallback;
}

export function getCompanyInitial(companyName: string): string {
  const trimmed = companyName.trim();
  return trimmed.charAt(0).toUpperCase() || "A";
}

export function getPoweredByLine(branding: ResolvedOrganizationBranding): string {
  if (branding.hidePlatformBranding) {
    return branding.pdfFooter?.trim() || branding.companyName;
  }

  return `Powered by ${PLATFORM_NAME}`;
}

export function getLoginDisplayTitle(branding: ResolvedOrganizationBranding): string {
  return branding.loginTitle?.trim() || branding.platformName?.trim() || branding.companyName;
}

export function getLoginDisplaySubtitle(branding: ResolvedOrganizationBranding): string {
  return (
    branding.loginSubtitle?.trim() ||
    branding.loginWelcomeMessage?.trim() ||
    "Monitor clients. Detect risks. Prove value."
  );
}

export function getPortalDisplayTitle(branding: ResolvedOrganizationBranding): string {
  return branding.portalTitle?.trim() || `${branding.companyName} Client Portal`;
}

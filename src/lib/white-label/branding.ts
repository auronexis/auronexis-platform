import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_PORTAL_WELCOME_MESSAGE,
  PLATFORM_NAME,
  normalizeHexColor,
} from "@/lib/branding/defaults";
import { getPlatformBrandingDefaults } from "@/lib/branding/platform-defaults";
import type { OrganizationBranding } from "@/types/database";
import type { WhiteLabelSettings } from "@/types/database";
import type { ResolvedWhiteLabelBranding, WhiteLabelThemeTokens } from "@/lib/white-label/types";
import { buildThemeCssVariables, buildThemeTokens } from "@/lib/white-label/themes";
import { sanitizeCustomCss } from "@/lib/white-label/validation";

export function mapLegacyBrandingToSettings(
  organizationName: string,
  legacy: OrganizationBranding | null,
): Partial<WhiteLabelSettings> | null {
  if (!legacy) {
    return null;
  }

  return {
    company_name: legacy.company_name,
    primary_color: legacy.primary_color,
    secondary_color: legacy.secondary_color,
    logo_light: legacy.logo_url,
    portal_welcome_message: legacy.portal_welcome_message,
    platform_name: organizationName,
  } as Partial<WhiteLabelSettings>;
}

export function resolveWhiteLabelBranding(input: {
  organizationName: string;
  settings: WhiteLabelSettings | null;
  legacy: OrganizationBranding | null;
  publishedOnly?: boolean;
}): ResolvedWhiteLabelBranding {
  const merged = mergeSettings(input.settings, input.legacy, input.organizationName);
  if (input.publishedOnly && !merged.published_at) {
    return buildPlatformDefaults(input.organizationName);
  }

  const themeInput = {
    primary: merged.primary_color,
    secondary: merged.secondary_color,
    accent: merged.accent_color,
    success: merged.success_color,
    warning: merged.warning_color,
    danger: merged.danger_color,
  };
  const themeTokens = buildThemeTokens(themeInput);
  const companyName = merged.company_name?.trim() || input.organizationName || PLATFORM_NAME;
  const platformName = merged.platform_name?.trim() || companyName;

  return {
    companyName,
    platformName,
    primaryColor: themeTokens.primary,
    secondaryColor: themeTokens.secondary,
    accentColor: themeTokens.accent,
    successColor: themeTokens.success,
    warningColor: themeTokens.warning,
    dangerColor: themeTokens.danger,
    logoUrl: merged.logo_light ?? merged.logo_dark ?? null,
    logoLightUrl: merged.logo_light,
    logoDarkUrl: merged.logo_dark,
    faviconUrl: merged.favicon,
    loginBackgroundUrl: merged.login_background,
    dashboardBackgroundUrl: merged.dashboard_background,
    portalWelcomeMessage:
      merged.portal_welcome_message?.trim() || DEFAULT_PORTAL_WELCOME_MESSAGE,
    portalTitle: merged.portal_title?.trim() || `${companyName} Client Portal`,
    portalDescription: merged.portal_description,
    loginTitle: merged.login_title?.trim() || platformName,
    loginSubtitle: merged.login_subtitle,
    loginWelcomeMessage: merged.login_welcome_message,
    supportEmail: merged.support_email,
    supportUrl: merged.support_url,
    website: merged.website,
    privacyUrl: merged.privacy_url,
    termsUrl: merged.terms_url,
    emailSenderName: merged.email_sender_name,
    emailSenderAddress: merged.email_sender_address,
    pdfFooter: merged.pdf_footer,
    customCss: sanitizeCustomCss(merged.custom_css),
    customDomain: merged.custom_domain,
    domainVerificationStatus: merged.domain_verification_status,
    domainSslStatus: merged.domain_ssl_status,
    themeTokens,
    cssVariables: buildThemeCssVariables(themeTokens),
    published: Boolean(merged.published_at),
    hidePlatformBranding: Boolean(merged.published_at),
  };
}

function mergeSettings(
  settings: WhiteLabelSettings | null,
  legacy: OrganizationBranding | null,
  organizationName: string,
): WhiteLabelSettings {
  const legacyPartial = mapLegacyBrandingToSettings(organizationName, legacy);
  const base = settings ?? (legacyPartial as WhiteLabelSettings | null);

  if (!base && !legacyPartial) {
    return defaultSettingsRow(organizationName);
  }

  return {
    ...defaultSettingsRow(organizationName),
    ...(legacyPartial ?? {}),
    ...(settings ?? {}),
  } as WhiteLabelSettings;
}

function defaultSettingsRow(organizationName: string): WhiteLabelSettings {
  return {
    id: "",
    organization_id: "",
    company_name: organizationName,
    platform_name: organizationName,
    logo_light: null,
    logo_dark: null,
    favicon: null,
    login_background: null,
    dashboard_background: null,
    primary_color: DEFAULT_PRIMARY_COLOR,
    secondary_color: DEFAULT_SECONDARY_COLOR,
    accent_color: DEFAULT_PRIMARY_COLOR,
    success_color: "#16A34A",
    warning_color: "#D97706",
    danger_color: "#DC2626",
    support_email: null,
    support_url: null,
    website: null,
    privacy_url: null,
    terms_url: null,
    custom_css: null,
    custom_domain: null,
    domain_verification_status: "not_configured",
    domain_ssl_status: "not_configured",
    domain_verified_at: null,
    email_sender_name: null,
    email_sender_address: null,
    portal_title: null,
    portal_description: null,
    portal_welcome_message: DEFAULT_PORTAL_WELCOME_MESSAGE,
    login_title: null,
    login_subtitle: null,
    login_welcome_message: null,
    pdf_footer: null,
    published_at: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function buildPlatformDefaults(organizationName: string): ResolvedWhiteLabelBranding {
  const platform = getPlatformBrandingDefaults();
  const themeTokens = buildThemeTokens({
    primary: DEFAULT_PRIMARY_COLOR,
    secondary: DEFAULT_SECONDARY_COLOR,
    accent: DEFAULT_PRIMARY_COLOR,
    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
  });

  return {
    companyName: PLATFORM_NAME,
    platformName: PLATFORM_NAME,
    primaryColor: platform.primaryColor,
    secondaryColor: platform.secondaryColor,
    accentColor: DEFAULT_PRIMARY_COLOR,
    successColor: themeTokens.success,
    warningColor: themeTokens.warning,
    dangerColor: themeTokens.danger,
    logoUrl: platform.logoUrl ?? null,
    logoLightUrl: platform.logoLightUrl ?? null,
    logoDarkUrl: platform.logoDarkUrl ?? null,
    faviconUrl: platform.faviconUrl ?? null,
    loginBackgroundUrl: platform.loginBackgroundUrl ?? null,
    dashboardBackgroundUrl: null,
    portalWelcomeMessage: DEFAULT_PORTAL_WELCOME_MESSAGE,
    portalTitle: `${PLATFORM_NAME} Client Portal`,
    portalDescription: null,
    loginTitle: PLATFORM_NAME,
    loginSubtitle: "Monitor clients. Detect risks. Prove value.",
    loginWelcomeMessage: null,
    supportEmail: null,
    supportUrl: null,
    website: null,
    privacyUrl: null,
    termsUrl: null,
    emailSenderName: null,
    emailSenderAddress: null,
    pdfFooter: null,
    customCss: null,
    customDomain: null,
    domainVerificationStatus: "not_configured",
    domainSslStatus: "not_configured",
    themeTokens,
    cssVariables: buildThemeCssVariables(themeTokens),
    published: false,
    hidePlatformBranding: false,
  };
}

export function toLegacyResolvedBranding(
  branding: ResolvedWhiteLabelBranding,
): import("@/lib/branding/defaults").ResolvedOrganizationBranding {
  const platform = getPlatformBrandingDefaults();

  return {
    companyName: branding.companyName,
    platformName: branding.platformName,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    accentColor: branding.accentColor,
    successColor: branding.successColor,
    warningColor: branding.warningColor,
    dangerColor: branding.dangerColor,
    logoUrl: branding.logoUrl ?? platform.logoUrl,
    logoLightUrl: branding.logoLightUrl ?? platform.logoLightUrl,
    logoDarkUrl: branding.logoDarkUrl ?? platform.logoDarkUrl,
    logoHorizontalUrl: platform.logoHorizontalUrl,
    iconUrl: branding.logoLightUrl ?? branding.logoUrl ?? platform.iconUrl,
    faviconUrl: branding.faviconUrl ?? platform.faviconUrl,
    loginBackgroundUrl: branding.loginBackgroundUrl ?? platform.loginBackgroundUrl,
    portalWelcomeMessage: branding.portalWelcomeMessage,
    portalTitle: branding.portalTitle,
    themeTokens: branding.themeTokens,
    cssVariables: branding.cssVariables,
    hidePlatformBranding: branding.hidePlatformBranding,
  };
}

export { normalizeHexColor };

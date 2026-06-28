/** White Label Platform types. */

export type WhiteLabelDomainVerificationStatus =
  | "not_configured"
  | "pending"
  | "verified"
  | "failed";

export type WhiteLabelDomainSslStatus =
  | "not_configured"
  | "pending"
  | "active"
  | "failed";

export type WhiteLabelAssetKind =
  | "logo_light"
  | "logo_dark"
  | "favicon"
  | "login_background"
  | "dashboard_background"
  | "portal_logo"
  | "email_logo"
  | "pdf_logo"
  | "avatar_placeholder";

export type WhiteLabelThemeTokens = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  background: string;
  border: string;
  text: string;
  muted: string;
  success: string;
  warning: string;
  danger: string;
};

export type ResolvedWhiteLabelBranding = {
  companyName: string;
  platformName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  logoUrl: string | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  loginBackgroundUrl: string | null;
  dashboardBackgroundUrl: string | null;
  portalWelcomeMessage: string;
  portalTitle: string;
  portalDescription: string | null;
  loginTitle: string;
  loginSubtitle: string | null;
  loginWelcomeMessage: string | null;
  supportEmail: string | null;
  supportUrl: string | null;
  website: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
  emailSenderName: string | null;
  emailSenderAddress: string | null;
  pdfFooter: string | null;
  customCss: string | null;
  customDomain: string | null;
  domainVerificationStatus: WhiteLabelDomainVerificationStatus;
  domainSslStatus: WhiteLabelDomainSslStatus;
  themeTokens: WhiteLabelThemeTokens;
  cssVariables: string;
  published: boolean;
  hidePlatformBranding: boolean;
};

export type WhiteLabelSettingsView = {
  id: string;
  organizationId: string;
  companyName: string;
  platformName: string | null;
  logoLight: string | null;
  logoDark: string | null;
  favicon: string | null;
  loginBackground: string | null;
  dashboardBackground: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  supportEmail: string | null;
  supportUrl: string | null;
  website: string | null;
  privacyUrl: string | null;
  termsUrl: string | null;
  customCss: string | null;
  customDomain: string | null;
  domainVerificationStatus: WhiteLabelDomainVerificationStatus;
  domainSslStatus: WhiteLabelDomainSslStatus;
  domainVerifiedAt: string | null;
  emailSenderName: string | null;
  emailSenderAddress: string | null;
  portalTitle: string | null;
  portalDescription: string | null;
  portalWelcomeMessage: string | null;
  loginTitle: string | null;
  loginSubtitle: string | null;
  loginWelcomeMessage: string | null;
  pdfFooter: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export type WhiteLabelDiagnosticsSnapshot = {
  tableReachable: boolean;
  brandConfigured: boolean;
  themeConfigured: boolean;
  portalConfigured: boolean;
  emailBrandingConfigured: boolean;
  pdfBrandingConfigured: boolean;
  customDomainConfigured: boolean;
  assetsConfigured: number;
  cacheEnabled: boolean;
  published: boolean;
};

export const WHITE_LABEL_PLATFORM_VERSION = "white-label-v1";

export const DEFAULT_ASSET_MAX_BYTES = 2 * 1024 * 1024;

export const ALLOWED_ASSET_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;

export type WhiteLabelAssetMimeType = (typeof ALLOWED_ASSET_MIME_TYPES)[number];

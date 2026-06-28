import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  PLATFORM_NAME,
  type ResolvedOrganizationBranding,
} from "@/lib/branding/defaults";
import { getPlatformBrandingDefaults } from "@/lib/branding/platform-defaults";
import { resolveWhiteLabelBranding, toLegacyResolvedBranding } from "@/lib/white-label/branding";
import { getCachedWhiteLabelBranding, setCachedWhiteLabelBranding } from "@/lib/white-label/cache";
import type {
  ResolvedWhiteLabelBranding,
  WhiteLabelDiagnosticsSnapshot,
  WhiteLabelSettingsView,
} from "@/lib/white-label/types";
import { isFeatureEnabled } from "@/lib/plans/features";
import { getCurrentPlan } from "@/lib/plans/queries";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationBranding, WhiteLabelSettings } from "@/types/database";

const SETTINGS_SELECT = "*";

function rowToView(row: WhiteLabelSettings): WhiteLabelSettingsView {
  return {
    id: row.id,
    organizationId: row.organization_id,
    companyName: row.company_name,
    platformName: row.platform_name,
    logoLight: row.logo_light,
    logoDark: row.logo_dark,
    favicon: row.favicon,
    loginBackground: row.login_background,
    dashboardBackground: row.dashboard_background,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    successColor: row.success_color,
    warningColor: row.warning_color,
    dangerColor: row.danger_color,
    supportEmail: row.support_email,
    supportUrl: row.support_url,
    website: row.website,
    privacyUrl: row.privacy_url,
    termsUrl: row.terms_url,
    customCss: row.custom_css,
    customDomain: row.custom_domain,
    domainVerificationStatus: row.domain_verification_status,
    domainSslStatus: row.domain_ssl_status,
    domainVerifiedAt: row.domain_verified_at,
    emailSenderName: row.email_sender_name,
    emailSenderAddress: row.email_sender_address,
    portalTitle: row.portal_title,
    portalDescription: row.portal_description,
    portalWelcomeMessage: row.portal_welcome_message,
    loginTitle: row.login_title,
    loginSubtitle: row.login_subtitle,
    loginWelcomeMessage: row.login_welcome_message,
    pdfFooter: row.pdf_footer,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export async function getWhiteLabelSettingsRecord(
  organizationId: string,
): Promise<WhiteLabelSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("white_label_settings")
    .select(SETTINGS_SELECT)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (data as WhiteLabelSettings | null) ?? null;
}

async function getLegacyBrandingRecord(
  organizationId: string,
): Promise<OrganizationBranding | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organization_branding")
    .select("id, organization_id, company_name, primary_color, secondary_color, logo_url, portal_welcome_message, created_at, updated_at")
    .eq("organization_id", organizationId)
    .maybeSingle();
  return (data as OrganizationBranding | null) ?? null;
}

export async function getWhiteLabelSettingsView(
  organizationId: string,
): Promise<WhiteLabelSettingsView | null> {
  const row = await getWhiteLabelSettingsRecord(organizationId);
  return row ? rowToView(row) : null;
}

async function resolveForOrganization(input: {
  organizationId: string;
  organizationName: string;
  publishedOnly?: boolean;
}): Promise<ResolvedWhiteLabelBranding> {
  const cached = getCachedWhiteLabelBranding(input.organizationId, input.publishedOnly ?? false);
  if (cached) {
    return cached;
  }

  const [settings, legacy, planKey] = await Promise.all([
    getWhiteLabelSettingsRecord(input.organizationId),
    getLegacyBrandingRecord(input.organizationId),
    getCurrentPlan(input.organizationId),
  ]);

  if (!isFeatureEnabled(planKey, "white_label")) {
    const fallback = resolveWhiteLabelBranding({
      organizationName: PLATFORM_NAME,
      settings: null,
      legacy: null,
      publishedOnly: false,
    });
    setCachedWhiteLabelBranding(input.organizationId, fallback, input.publishedOnly ?? false);
    return fallback;
  }

  const resolved = resolveWhiteLabelBranding({
    organizationName: input.organizationName,
    settings,
    legacy,
    publishedOnly: input.publishedOnly,
  });

  setCachedWhiteLabelBranding(input.organizationId, resolved, input.publishedOnly ?? false);
  return resolved;
}

export async function getResolvedWhiteLabelBranding(
  session: SessionContext,
  options?: { publishedOnly?: boolean },
): Promise<ResolvedWhiteLabelBranding> {
  return resolveForOrganization({
    organizationId: session.organization.id,
    organizationName: session.organization.name,
    publishedOnly: options?.publishedOnly,
  });
}

export async function getResolvedWhiteLabelBrandingForOrganization(
  organizationId: string,
  organizationName: string,
  options?: { publishedOnly?: boolean },
): Promise<ResolvedWhiteLabelBranding> {
  return resolveForOrganization({
    organizationId,
    organizationName,
    publishedOnly: options?.publishedOnly,
  });
}

export async function getBrandingFromWhiteLabel(
  session: SessionContext,
): Promise<ResolvedOrganizationBranding> {
  const branding = await getResolvedWhiteLabelBranding(session, { publishedOnly: true });
  return toLegacyResolvedBranding(branding);
}

export async function getBrandingFromWhiteLabelForOrganization(
  organizationId: string,
  organizationName: string,
): Promise<ResolvedOrganizationBranding> {
  const branding = await getResolvedWhiteLabelBrandingForOrganization(organizationId, organizationName, {
    publishedOnly: true,
  });
  return toLegacyResolvedBranding(branding);
}

export async function getWhiteLabelDiagnosticsSnapshot(
  session: SessionContext,
): Promise<WhiteLabelDiagnosticsSnapshot> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("white_label_settings")
    .select("*")
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  const row = data as WhiteLabelSettings | null;
  const assetFields = [
    row?.logo_light,
    row?.logo_dark,
    row?.favicon,
    row?.login_background,
    row?.dashboard_background,
  ].filter(Boolean);

  return {
    tableReachable: !error,
    brandConfigured: Boolean(row?.company_name && row.company_name.length > 1),
    themeConfigured: Boolean(row?.primary_color && row?.secondary_color),
    portalConfigured: Boolean(row?.portal_title || row?.portal_welcome_message),
    emailBrandingConfigured: Boolean(row?.email_sender_name || row?.email_sender_address),
    pdfBrandingConfigured: Boolean(row?.pdf_footer),
    customDomainConfigured: Boolean(row?.custom_domain),
    assetsConfigured: assetFields.length,
    cacheEnabled: true,
    published: Boolean(row?.published_at),
  };
}

export function getPlatformBrandingFallback(): ResolvedOrganizationBranding {
  return getPlatformBrandingDefaults();
}

export async function getPublishedBrandingByHostname(
  hostname: string,
): Promise<ResolvedOrganizationBranding | null> {
  const host = hostname.split(":")[0]?.trim().toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("white_label_settings")
    .select("organization_id")
    .eq("custom_domain", host)
    .not("published_at", "is", null)
    .maybeSingle();

  const row = data as Pick<WhiteLabelSettings, "organization_id"> | null;

  if (error || !row?.organization_id) {
    return null;
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", row.organization_id)
    .maybeSingle();

  const organizationRow = organization as { name: string | null } | null;

  return getBrandingFromWhiteLabelForOrganization(
    row.organization_id,
    organizationRow?.name?.trim() || PLATFORM_NAME,
  );
}

import { createClient } from "@/lib/supabase/server";
import {
  resolveOrganizationBranding,
  type ResolvedOrganizationBranding,
} from "@/lib/branding/defaults";
import { getPlatformBrandingDefaults } from "@/lib/branding/platform-defaults";
import {
  getBrandingFromWhiteLabel,
  getBrandingFromWhiteLabelForOrganization,
} from "@/lib/white-label/queries";
import { isFeatureEnabled } from "@/lib/plans/features";
import { getCurrentPlan } from "@/lib/plans/queries";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationBranding } from "@/types/database";

const BRANDING_SELECT =
  "id, organization_id, company_name, primary_color, secondary_color, logo_url, portal_welcome_message, created_at, updated_at";

/** Load raw branding row for an organization, if configured. */
export async function getOrganizationBrandingRecord(
  organizationId: string,
): Promise<OrganizationBranding | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_branding")
    .select(BRANDING_SELECT)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as OrganizationBranding | null) ?? null;
}

function resolveBrandingForPlan(
  organizationName: string,
  branding: OrganizationBranding | null,
  planKey: Awaited<ReturnType<typeof getCurrentPlan>>,
): ResolvedOrganizationBranding {
  if (!isFeatureEnabled(planKey, "white_label")) {
    return getPlatformBrandingDefaults();
  }

  return resolveOrganizationBranding(organizationName, branding);
}

/** Resolve branding for the signed-in agency user. */
export async function getOrganizationBranding(
  session: SessionContext,
): Promise<ResolvedOrganizationBranding> {
  const planKey = await getCurrentPlan(session.organization.id);
  if (!isFeatureEnabled(planKey, "white_label")) {
    return resolveBrandingForPlan(session.organization.name, null, planKey);
  }

  try {
    return await getBrandingFromWhiteLabel(session);
  } catch {
    const record = await getOrganizationBrandingRecord(session.organization.id);
    return resolveBrandingForPlan(session.organization.name, record, planKey);
  }
}

/** Resolve branding by organization id and name — portal and server routes. */
export async function getOrganizationBrandingForOrganization(
  organizationId: string,
  organizationName: string,
): Promise<ResolvedOrganizationBranding> {
  const planKey = await getCurrentPlan(organizationId);
  if (!isFeatureEnabled(planKey, "white_label")) {
    return resolveBrandingForPlan(organizationName, null, planKey);
  }

  try {
    return await getBrandingFromWhiteLabelForOrganization(organizationId, organizationName);
  } catch {
    const record = await getOrganizationBrandingRecord(organizationId);
    return resolveBrandingForPlan(organizationName, record, planKey);
  }
}

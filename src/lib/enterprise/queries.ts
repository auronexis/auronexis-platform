import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import type {
  EnterpriseRequestView,
  EnterpriseStatus,
  OrganizationPlanOverrideView,
} from "@/lib/enterprise/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { EnterpriseRequest, OrganizationPlanOverride } from "@/types/database";

function mapRequest(row: EnterpriseRequest): EnterpriseRequestView {
  return {
    id: row.id,
    organizationId: row.organization_id,
    requestedBy: row.requested_by,
    contactEmail: row.contact_email,
    companyName: row.company_name,
    requestedSeats: row.requested_seats,
    requestedClients: row.requested_clients,
    requestedFeatures: row.requested_features ?? [],
    notes: row.notes,
    status: row.status as EnterpriseRequestView["status"],
    handledBy: row.handled_by,
    handledAt: row.handled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parsePlanKey(value: string): PlanKey {
  if (value === "professional" || value === "business" || value === "enterprise" || value === "starter") {
    return value;
  }
  return "enterprise";
}

function mapOverride(row: OrganizationPlanOverride): OrganizationPlanOverrideView {
  return {
    id: row.id,
    organizationId: row.organization_id,
    plan: parsePlanKey(row.plan),
    status: row.status as OrganizationPlanOverrideView["status"],
    seatsLimit: row.seats_limit,
    clientsLimit: row.clients_limit,
    monitoringLimit: row.monitoring_limit,
    apiEnabled: row.api_enabled,
    webhooksEnabled: row.webhooks_enabled,
    aiEnabled: row.ai_enabled,
    portalBrandingEnabled: row.portal_branding_enabled,
    customDomainEnabled: row.custom_domain_enabled,
    prioritySupportEnabled: row.priority_support_enabled,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPlanOverride(
  organizationId: string,
): Promise<OrganizationPlanOverrideView | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("organization_plan_overrides")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    return data ? mapOverride(data as OrganizationPlanOverride) : null;
  } catch {
    return null;
  }
}

export async function getPlanOverrideForSession(
  organizationId: string,
): Promise<OrganizationPlanOverrideView | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organization_plan_overrides")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data ? mapOverride(data as OrganizationPlanOverride) : null;
  } catch {
    return null;
  }
}

export async function listEnterpriseRequests(
  organizationId: string,
): Promise<EnterpriseRequestView[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("enterprise_requests")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return ((data ?? []) as EnterpriseRequest[]).map(mapRequest);
  } catch {
    return [];
  }
}

export async function getEnterpriseRequest(
  organizationId: string,
  requestId: string,
): Promise<EnterpriseRequestView | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("enterprise_requests")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", requestId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapRequest(data as EnterpriseRequest);
  } catch {
    return null;
  }
}

export async function getLatestEnterpriseRequest(
  organizationId: string,
): Promise<EnterpriseRequestView | null> {
  const requests = await listEnterpriseRequests(organizationId);
  return requests[0] ?? null;
}

export async function getEnterpriseStatus(organizationId: string): Promise<EnterpriseStatus> {
  const [override, latestRequest] = await Promise.all([
    getPlanOverrideForSession(organizationId),
    getLatestEnterpriseRequest(organizationId),
  ]);

  const activeOverride = override?.status === "active" ? override : null;

  return {
    hasActiveOverride: activeOverride != null,
    override: activeOverride,
    latestRequest,
    isEnterpriseActive: activeOverride?.plan === "enterprise" || false,
    apiEnabled: activeOverride?.apiEnabled ?? false,
    webhooksEnabled: activeOverride?.webhooksEnabled ?? false,
    aiEnabled: activeOverride?.aiEnabled ?? false,
    prioritySupportEnabled: activeOverride?.prioritySupportEnabled ?? false,
    portalBrandingEnabled: activeOverride?.portalBrandingEnabled ?? false,
    customDomainEnabled: activeOverride?.customDomainEnabled ?? false,
  };
}

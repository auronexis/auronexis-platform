import "server-only";

import type { ClientPortalSessionContext } from "@/lib/client-portal/types";
import type { ClientSlaAssignment, PortalSlaSummary } from "@/lib/sla/types";
import { resolveSeverityTargets, formatSeverityTarget } from "@/lib/sla/policies";
import { getComplianceRate } from "@/lib/sla/metrics";
import { createClient } from "@/lib/supabase/server";
import type { SlaPolicy } from "@/types/database";

const SLA_POLICY_PORTAL_SELECT =
  "id, organization_id, name, incident_hours, risk_hours, is_default, critical_response_minutes, critical_resolution_minutes, high_response_minutes, high_resolution_minutes, medium_response_minutes, medium_resolution_minutes, low_response_minutes, low_resolution_minutes, created_at, updated_at";

async function getPortalDefaultSlaPolicy(organizationId: string): Promise<SlaPolicy | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sla_policies")
    .select(SLA_POLICY_PORTAL_SELECT)
    .eq("organization_id", organizationId)
    .eq("is_default", true)
    .maybeSingle();

  return (data as SlaPolicy | null) ?? null;
}

async function getPortalSlaAssignmentInternal(
  session: ClientPortalSessionContext,
): Promise<ClientSlaAssignment> {
  const defaultPolicy = await getPortalDefaultSlaPolicy(session.organization.id);
  const assignedPolicyId = session.client.sla_policy_id;

  if (assignedPolicyId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sla_policies")
      .select(SLA_POLICY_PORTAL_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("id", assignedPolicyId)
      .maybeSingle();

    const policy = (data as SlaPolicy | null) ?? null;
    return {
      assignedPolicyId,
      effectivePolicy: policy ?? defaultPolicy,
      source: policy ? "assigned" : defaultPolicy ? "inherited" : "none",
    };
  }

  if (defaultPolicy) {
    return {
      assignedPolicyId: null,
      effectivePolicy: defaultPolicy,
      source: "inherited",
    };
  }

  return {
    assignedPolicyId: null,
    effectivePolicy: null,
    source: "none",
  };
}

/** Portal SLA summary without internal timers — never throws. */
export async function getPortalSLA(
  session: ClientPortalSessionContext,
): Promise<PortalSlaSummary & { assignment: ClientSlaAssignment }> {
  try {
    const assignment = await getPortalSlaAssignmentInternal(session);
    const supabase = await createClient();
    const { data } = await supabase
      .from("sla_events")
      .select(
        "breached, responded_at, resolved_at, started_at, response_due_at, resolution_due_at, status, created_at",
      )
      .eq("organization_id", session.organization.id)
      .eq("client_id", session.client.id);

    const rows = (data ?? []) as Array<{
      breached: boolean;
      responded_at: string | null;
      resolved_at: string | null;
      started_at: string | null;
      response_due_at: string | null;
      resolution_due_at: string | null;
      status: string;
      created_at: string;
    }>;
    const policy = assignment.effectivePolicy;
    const mediumTargets = resolveSeverityTargets(policy, "medium");

    return {
      assignment,
      policyName: policy?.name ?? null,
      compliancePercent: getComplianceRate(rows),
      responseTarget: formatSeverityTarget(mediumTargets.responseMinutes),
      resolutionTarget: formatSeverityTarget(mediumTargets.resolutionMinutes),
      breachCount: rows.filter((row) => row.breached).length,
    };
  } catch {
    return {
      assignment: {
        assignedPolicyId: null,
        effectivePolicy: null,
        source: "none",
      },
      policyName: null,
      compliancePercent: 100,
      responseTarget: "—",
      resolutionTarget: "—",
      breachCount: 0,
    };
  }
}

export { getPortalSlaAssignmentInternal as getPortalSlaAssignment };

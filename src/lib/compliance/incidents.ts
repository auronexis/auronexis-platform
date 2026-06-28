import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SecurityIncidentSeverity, SecurityIncidentStatus } from "@/lib/compliance/types";

export async function countOpenSecurityIncidents(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("security_incidents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["open", "investigating", "mitigated"]);
  return count ?? 0;
}

export async function listSecurityIncidents(organizationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("security_incidents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    severity: row.severity as SecurityIncidentSeverity,
    status: row.status as SecurityIncidentStatus,
    impact: (row.impact as string | null) ?? null,
    createdAt: row.created_at as string,
    resolvedAt: (row.resolved_at as string | null) ?? null,
  }));
}

export async function createSecurityIncident(input: {
  organizationId: string;
  reportedBy: string;
  title: string;
  description?: string;
  severity: SecurityIncidentSeverity;
  impact?: string;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("security_incidents")
    .insert({
      organization_id: input.organizationId,
      title: input.title,
      description: input.description ?? null,
      severity: input.severity,
      status: "open",
      impact: input.impact ?? null,
      reported_by: input.reportedBy,
      timeline: [{ at: new Date().toISOString(), event: "Incident opened" }],
      affected_entities: [],
    } as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateSecurityIncidentStatus(input: {
  organizationId: string;
  incidentId: string;
  status: SecurityIncidentStatus;
  mitigation?: string;
  rootCause?: string;
  postmortem?: string;
}) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("security_incidents")
    .update({
      status: input.status,
      mitigation: input.mitigation ?? null,
      root_cause: input.rootCause ?? null,
      postmortem: input.postmortem ?? null,
      resolved_at: input.status === "resolved" ? new Date().toISOString() : null,
    } as never)
    .eq("organization_id", input.organizationId)
    .eq("id", input.incidentId);

  if (error) {
    throw new Error(error.message);
  }
}

import "server-only";

import type { SessionContext } from "@/lib/tenancy/context";
import { createClient } from "@/lib/supabase/server";
import type {
  AgencyType,
  CustomerOnboardingRecord,
  CustomerSuccessRecord,
  LeadSourceRegion,
  OutboundList,
  OutboundListType,
  PortalCustomerOnboarding,
  ProspectSegment,
  SalesInboxKey,
  SalesLead,
  SalesLeadActivity,
  SalesLeadReminder,
  SalesPipelineStage,
  SalesProposal,
} from "@/types/database";
import { computeSalesExecutionMetrics } from "@/lib/sales/sales-execution-metrics";
import { computeFirstCustomerMetrics } from "@/lib/sales/execution-metrics";
import {
  LAUNCH_EXECUTION_TARGETS,
  computeLaunchTargetProgress,
  type LaunchExecutionTargetKey,
} from "@/lib/sales/launch-execution-targets";
import { TOP100_AGENCIES, TOP100_SEGMENT_SUMMARY } from "@/lib/sales/top100-agencies";
import { AGENCY_TYPES, LEAD_SOURCE_REGIONS } from "@/lib/sales/lead-sourcing";
import {
  ACTIVE_PIPELINE_STAGES,
  CLOSED_LOST_STAGE,
  CLOSED_WON_STAGE,
  SALES_INBOXES,
} from "@/lib/sales/pipeline-stages";
import { buildFoundingProgramStatus } from "@/lib/sales/founding-program";
import { DEFAULT_OUTBOUND_LISTS } from "@/lib/sales/outbound-lists";
import { buildAutomationSnapshot } from "@/lib/sales/automation";
import {
  computeAcquisitionDashboardMetrics,
  type AcquisitionDashboardMetrics,
} from "@/lib/sales/acquisition-metrics";

export type SalesLeadWithMeta = SalesLead & {
  ownerName: string | null;
};

export type PipelineDashboardMetrics = {
  leads: number;
  pilots: number;
  meetings: number;
  opportunities: number;
  mrrPipeline: number;
  conversionRate: number;
  closedWon: number;
  closedLost: number;
  foundingProgram: ReturnType<typeof buildFoundingProgramStatus>;
  inboxCounts: Record<SalesInboxKey, number>;
  stageCounts: Record<SalesPipelineStage, number>;
};

function mapLead(row: SalesLead, ownerName: string | null): SalesLeadWithMeta {
  return { ...row, ownerName };
}

export async function listSalesLeads(
  session: SessionContext,
  options?: { stage?: SalesPipelineStage; inbox?: SalesInboxKey; limit?: number },
): Promise<SalesLeadWithMeta[]> {
  const supabase = await createClient();
  let query = supabase
    .from("sales_leads")
    .select("*")
    .eq("organization_id", session.organization.id)
    .order("updated_at", { ascending: false });

  if (options?.stage) {
    query = query.eq("pipeline_stage", options.stage);
  }
  if (options?.inbox) {
    query = query.eq("inbox_key", options.inbox);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message.includes("sales_leads")) {
      return [];
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SalesLead[];
  const ownerIds = [...new Set(rows.map((row) => row.owner_user_id).filter(Boolean))] as string[];
  const ownerMap = new Map<string, string>();

  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from("users").select("id, full_name").in("id", ownerIds);
    for (const owner of (owners ?? []) as Array<{ id: string; full_name: string }>) {
      ownerMap.set(owner.id, owner.full_name);
    }
  }

  return rows.map((row) => mapLead(row, row.owner_user_id ? ownerMap.get(row.owner_user_id) ?? null : null));
}

export async function getSalesLead(session: SessionContext, leadId: string): Promise<SalesLeadWithMeta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales_leads")
    .select("*")
    .eq("organization_id", session.organization.id)
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const lead = data as SalesLead;
  let ownerName: string | null = null;
  if (lead.owner_user_id) {
    const { data: owner } = await supabase.from("users").select("full_name").eq("id", lead.owner_user_id).maybeSingle();
    ownerName = (owner as { full_name: string } | null)?.full_name ?? null;
  }

  return mapLead(lead, ownerName);
}

export async function listLeadActivities(session: SessionContext, leadId: string): Promise<SalesLeadActivity[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_lead_activities")
      .select("*")
      .eq("organization_id", session.organization.id)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return (data ?? []) as SalesLeadActivity[];
  } catch {
    return [];
  }
}

export async function getPipelineDashboardMetrics(session: SessionContext): Promise<PipelineDashboardMetrics> {
  try {
    const supabase = await createClient();
    const orgId = session.organization.id;

    const [{ data: leads }, { count: foundingCount }] = await Promise.all([
      supabase.from("sales_leads").select("pipeline_stage, mrr_estimate, inbox_key").eq("organization_id", orgId),
      supabase
        .from("founding_program_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
    ]);

  const rows = (leads ?? []) as Pick<SalesLead, "pipeline_stage" | "mrr_estimate" | "inbox_key">[];
  const stageCounts = Object.fromEntries(
    [
      "pilot_lead",
      "pilot_application",
      "discovery_call",
      "qualified",
      "proposal_sent",
      "negotiation",
      "won",
      "lost",
    ].map((stage) => [stage, 0]),
  ) as Record<SalesPipelineStage, number>;

  for (const row of rows) {
    stageCounts[row.pipeline_stage as SalesPipelineStage] += 1;
  }

  const inboxCounts = Object.fromEntries(SALES_INBOXES.map((inbox) => [inbox.key, 0])) as Record<
    SalesInboxKey,
    number
  >;
  for (const row of rows) {
    inboxCounts[row.inbox_key as SalesInboxKey] += 1;
  }

  const activeRows = rows.filter((row) =>
    ACTIVE_PIPELINE_STAGES.includes(row.pipeline_stage as SalesPipelineStage),
  );
  const mrrPipeline = activeRows.reduce((sum, row) => sum + Number(row.mrr_estimate ?? 0), 0);
  const closedWon = stageCounts[CLOSED_WON_STAGE];
  const closedLost = stageCounts[CLOSED_LOST_STAGE];
  const totalClosed = closedWon + closedLost;
  const conversionRate = totalClosed > 0 ? Math.round((closedWon / totalClosed) * 100) : 0;

  return {
    leads: stageCounts.pilot_lead,
    pilots: stageCounts.pilot_application,
    meetings: stageCounts.discovery_call,
    opportunities: stageCounts.qualified + stageCounts.proposal_sent + stageCounts.negotiation,
    mrrPipeline,
    conversionRate,
    closedWon,
    closedLost,
    foundingProgram: buildFoundingProgramStatus(foundingCount ?? 0),
    inboxCounts,
    stageCounts,
  };
  } catch {
    return {
      leads: 0,
      pilots: 0,
      meetings: 0,
      opportunities: 0,
      mrrPipeline: 0,
      conversionRate: 0,
      closedWon: 0,
      closedLost: 0,
      foundingProgram: buildFoundingProgramStatus(0),
      inboxCounts: Object.fromEntries(SALES_INBOXES.map((inbox) => [inbox.key, 0])) as Record<SalesInboxKey, number>,
      stageCounts: Object.fromEntries(
        [
          "pilot_lead",
          "pilot_application",
          "discovery_call",
          "qualified",
          "proposal_sent",
          "negotiation",
          "won",
          "lost",
        ].map((stage) => [stage, 0]),
      ) as Record<SalesPipelineStage, number>,
    };
  }
}

export async function listRecentOutreach(session: SessionContext, limit = 8): Promise<SalesLeadActivity[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_lead_activities")
      .select("*")
      .eq("organization_id", session.organization.id)
      .in("activity_type", ["email", "outreach", "call", "meeting"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (data ?? []) as SalesLeadActivity[];
  } catch {
    return [];
  }
}

export async function listOutboundLists(session: SessionContext): Promise<OutboundList[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("outbound_lists")
      .select("*")
      .eq("organization_id", session.organization.id)
      .order("list_type");

    if (error) {
      return [];
    }

    return (data ?? []) as OutboundList[];
  } catch {
    return [];
  }
}

export async function ensureOutboundLists(session: SessionContext): Promise<OutboundList[]> {
  const existing = await listOutboundLists(session);
  if (existing.length >= DEFAULT_OUTBOUND_LISTS.length) {
    return existing;
  }

  try {
    const supabase = await createClient();
    const missing = DEFAULT_OUTBOUND_LISTS.filter(
      (item) => !existing.some((row) => row.list_type === item.list_type),
    );

    if (missing.length > 0) {
      await supabase.from("outbound_lists").insert(
        missing.map((item) => ({
          organization_id: session.organization.id,
          name: item.name,
          list_type: item.list_type,
          description: item.description,
        })) as never,
      );
    }

    return listOutboundLists(session);
  } catch {
    return existing;
  }
}

export async function listOutboundLeads(
  session: SessionContext,
  options?: { segment?: ProspectSegment; listId?: string; limit?: number },
): Promise<SalesLeadWithMeta[]> {
  const supabase = await createClient();
  let query = supabase
    .from("sales_leads")
    .select("*")
    .eq("organization_id", session.organization.id)
    .order("priority_score", { ascending: false, nullsFirst: false });

  if (options?.segment) {
    query = query.eq("prospect_segment", options.segment);
  }
  if (options?.listId) {
    query = query.eq("outbound_list_id", options.listId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  try {
    const { data, error } = await query;
    if (error) {
      return [];
    }
    const rows = (data ?? []) as SalesLead[];
    return rows.map((row) => mapLead(row, null));
  } catch {
    return [];
  }
}

export async function getAcquisitionDashboard(
  session: SessionContext,
): Promise<AcquisitionDashboardMetrics> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_leads")
      .select("pipeline_stage, mrr_estimate, lead_value, potential_mrr, created_at, updated_at, priority_score")
      .eq("organization_id", session.organization.id);

    if (error) {
      return computeAcquisitionDashboardMetrics([]);
    }

    return computeAcquisitionDashboardMetrics((data ?? []) as SalesLead[]);
  } catch {
    return computeAcquisitionDashboardMetrics([]);
  }
}

export async function listCustomerSuccessRecords(
  session: SessionContext,
): Promise<CustomerSuccessRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customer_success_records")
      .select("*")
      .eq("organization_id", session.organization.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return [];
    }

    return (data ?? []) as CustomerSuccessRecord[];
  } catch {
    return [];
  }
}

export async function getAutomationDashboard(session: SessionContext) {
  try {
    const supabase = await createClient();
    const orgId = session.organization.id;
    const now = new Date().toISOString();

    const [{ data: leads }, { count: pending }, { count: overdue }] = await Promise.all([
      supabase
        .from("sales_leads")
        .select("last_outreach_at, last_contact_at, next_followup_at, no_response_flag, escalated_at, created_at")
        .eq("organization_id", orgId),
      supabase
        .from("sales_lead_reminders")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .is("completed_at", null)
        .gte("due_at", now),
      supabase
        .from("sales_lead_reminders")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .is("completed_at", null)
        .lt("due_at", now),
    ]);

    return buildAutomationSnapshot(
      (leads ?? []) as SalesLead[],
      pending ?? 0,
      overdue ?? 0,
    );
  } catch {
    return buildAutomationSnapshot([], 0, 0);
  }
}

export async function countLeadsByOutboundType(
  session: SessionContext,
): Promise<Record<OutboundListType, number>> {
  const counts = Object.fromEntries(
    DEFAULT_OUTBOUND_LISTS.map((item) => [item.list_type, 0]),
  ) as Record<OutboundListType, number>;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_leads")
      .select("prospect_segment")
      .eq("organization_id", session.organization.id)
      .not("prospect_segment", "is", null);

    if (error) {
      return counts;
    }

    for (const row of (data ?? []) as Array<{ prospect_segment: ProspectSegment | null }>) {
      if (row.prospect_segment) {
        counts[row.prospect_segment] += 1;
      }
    }
  } catch {
    // degrade gracefully
  }

  return counts;
}

export async function listPendingReminders(
  session: SessionContext,
  limit = 10,
): Promise<SalesLeadReminder[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_lead_reminders")
      .select("*")
      .eq("organization_id", session.organization.id)
      .is("completed_at", null)
      .order("due_at")
      .limit(limit);

    if (error) {
      return [];
    }

    return (data ?? []) as SalesLeadReminder[];
  } catch {
    return [];
  }
}

export async function getSalesExecutionDashboard(session: SessionContext) {
  try {
    const supabase = await createClient();
    const orgId = session.organization.id;
    const [{ data: leads }, { data: activities }] = await Promise.all([
      supabase
        .from("sales_leads")
        .select("pipeline_stage, mrr_estimate, potential_mrr, reply_received_at")
        .eq("organization_id", orgId),
      supabase
        .from("sales_lead_activities")
        .select("activity_type")
        .eq("organization_id", orgId),
    ]);

    return computeSalesExecutionMetrics(
      (activities ?? []) as SalesLeadActivity[],
      (leads ?? []) as SalesLead[],
    );
  } catch {
    return computeSalesExecutionMetrics([], []);
  }
}

export async function countLeadsByRegion(
  session: SessionContext,
): Promise<Record<LeadSourceRegion, number>> {
  const counts = Object.fromEntries(LEAD_SOURCE_REGIONS.map((r) => [r.key, 0])) as Record<
    LeadSourceRegion,
    number
  >;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sales_leads")
      .select("source_region")
      .eq("organization_id", session.organization.id)
      .not("source_region", "is", null);
    for (const row of (data ?? []) as Array<{ source_region: LeadSourceRegion | null }>) {
      if (row.source_region) counts[row.source_region] += 1;
    }
  } catch {
    // degrade
  }
  return counts;
}

export async function countLeadsByAgencyType(
  session: SessionContext,
): Promise<Record<AgencyType, number>> {
  const counts = Object.fromEntries(AGENCY_TYPES.map((t) => [t.key, 0])) as Record<
    AgencyType,
    number
  >;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sales_leads")
      .select("agency_type")
      .eq("organization_id", session.organization.id)
      .not("agency_type", "is", null);
    for (const row of (data ?? []) as Array<{ agency_type: AgencyType | null }>) {
      if (row.agency_type) counts[row.agency_type] += 1;
    }
  } catch {
    // degrade
  }
  return counts;
}

export async function listSourcedLeads(
  session: SessionContext,
  options?: { region?: LeadSourceRegion; agencyType?: AgencyType; limit?: number },
): Promise<SalesLeadWithMeta[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("sales_leads")
      .select("*")
      .eq("organization_id", session.organization.id)
      .order("priority_score", { ascending: false, nullsFirst: false });
    if (options?.region) query = query.eq("source_region", options.region);
    if (options?.agencyType) query = query.eq("agency_type", options.agencyType);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) return [];
    return ((data ?? []) as SalesLead[]).map((row) => mapLead(row, null));
  } catch {
    return [];
  }
}

export async function listSalesProposals(session: SessionContext): Promise<SalesProposal[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_proposals")
      .select("*")
      .eq("organization_id", session.organization.id)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as SalesProposal[];
  } catch {
    return [];
  }
}

export async function getSalesProposal(
  session: SessionContext,
  proposalId: string,
): Promise<SalesProposal | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sales_proposals")
      .select("*")
      .eq("organization_id", session.organization.id)
      .eq("id", proposalId)
      .maybeSingle();
    if (error || !data) return null;
    return data as SalesProposal;
  } catch {
    return null;
  }
}

export async function listCustomerOnboardingRecords(
  session: SessionContext,
): Promise<CustomerOnboardingRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customer_onboarding_records")
      .select("*")
      .eq("organization_id", session.organization.id)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as CustomerOnboardingRecord[];
  } catch {
    return [];
  }
}

export async function listPortalOnboardingRecords(
  session: SessionContext,
): Promise<PortalCustomerOnboarding[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portal_customer_onboarding")
      .select("*")
      .eq("organization_id", session.organization.id)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as PortalCustomerOnboarding[];
  } catch {
    return [];
  }
}

export async function getFirstCustomerMetricsDashboard(session: SessionContext) {
  try {
    const supabase = await createClient();
    const [{ data: leads }, { data: portal }] = await Promise.all([
      supabase
        .from("sales_leads")
        .select("pipeline_stage, mrr_estimate, potential_mrr, lead_value, created_at, updated_at")
        .eq("organization_id", session.organization.id),
      supabase
        .from("portal_customer_onboarding")
        .select("satisfaction_score")
        .eq("organization_id", session.organization.id),
    ]);
    return computeFirstCustomerMetrics(
      (leads ?? []) as SalesLead[],
      (portal ?? []) as PortalCustomerOnboarding[],
    );
  } catch {
    return computeFirstCustomerMetrics([], []);
  }
}

export type LaunchExecutionDashboard = {
  metrics: ReturnType<typeof computeSalesExecutionMetrics>;
  targets: typeof LAUNCH_EXECUTION_TARGETS;
  progress: ReturnType<typeof computeLaunchTargetProgress>;
  actual: Record<LaunchExecutionTargetKey, number>;
  top100Seeded: number;
  top100Total: number;
  segmentSummary: typeof TOP100_SEGMENT_SUMMARY;
};

export async function getLaunchExecutionDashboard(
  session: SessionContext,
): Promise<LaunchExecutionDashboard> {
  const metrics = await getSalesExecutionDashboard(session);
  const actual: Record<LaunchExecutionTargetKey, number> = {
    outreach: metrics.outreachSent,
    discoveryCalls: metrics.discoveryCalls,
    pilots: metrics.pilots,
    customers: metrics.wonDeals,
  };

  let top100Seeded = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("sales_leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", session.organization.id)
      .not("source_region", "is", null);
    top100Seeded = count ?? 0;
  } catch {
    top100Seeded = 0;
  }

  return {
    metrics,
    targets: LAUNCH_EXECUTION_TARGETS,
    progress: computeLaunchTargetProgress(actual),
    actual,
    top100Seeded,
    top100Total: TOP100_AGENCIES.length,
    segmentSummary: TOP100_SEGMENT_SUMMARY,
  };
}

import type { SessionContext } from "@/lib/tenancy/context";
import type { KnowledgeHubData } from "@/lib/ai/knowledge/types";
import type { OrganizationPlanContext } from "@/lib/plans/types";
import { createClient } from "@/lib/supabase/server";
import type { ActivationDataSnapshot } from "@/lib/activation/types";

const BILLING_ISSUE_STATUSES = ["past_due", "unpaid", "incomplete"] as const;

function hasBillingIssue(planContext: OrganizationPlanContext | null): boolean {
  if (!planContext?.subscriptionStatus) {
    return false;
  }
  return BILLING_ISSUE_STATUSES.includes(
    planContext.subscriptionStatus as (typeof BILLING_ISSUE_STATUSES)[number],
  );
}

function isBillingConfigured(planContext: OrganizationPlanContext | null): boolean {
  if (!planContext) {
    return false;
  }
  return planContext.isActiveSubscription || planContext.planKey !== "starter";
}

function billingBlocksCheckout(planContext: OrganizationPlanContext | null): boolean {
  if (!planContext?.subscriptionStatus) {
    return false;
  }
  return planContext.subscriptionStatus === "unpaid" || planContext.subscriptionStatus === "past_due";
}

function knowledgeCount(knowledgeHub: KnowledgeHubData | null): number {
  if (!knowledgeHub) {
    return 0;
  }
  return (
    knowledgeHub.articles.length +
    knowledgeHub.playbooks.length +
    knowledgeHub.publishedReports.length
  );
}

async function countRows(
  table: string,
  organizationId: string,
  filter?: { column: string; value: string | boolean },
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) {
    return 0;
  }
  return count ?? 0;
}

export type ActivationQueryInput = {
  session: SessionContext;
  planContext: OrganizationPlanContext | null;
  teamMemberCount: number;
  pendingInvitationCount: number;
  knowledgeHub: KnowledgeHubData | null;
  openRiskCount?: number;
  monitoringConnectorCount?: number;
};

/** Lightweight activation counts — parallel queries, no N+1. */
export async function getActivationDataSnapshot(
  input: ActivationQueryInput,
): Promise<ActivationDataSnapshot> {
  const { session, planContext, teamMemberCount, pendingInvitationCount, knowledgeHub } = input;
  const organizationId = session.organization.id;
  const features = planContext?.features;

  const [
    clientCount,
    reportCount,
    draftReportCount,
    publishedReportCount,
    riskCount,
    incidentCount,
    slaPolicyCount,
    portalUserCount,
    monitoringConnectorCount,
  ] = await Promise.all([
    countRows("clients", organizationId),
    countRows("reports", organizationId),
    countRows("reports", organizationId, { column: "status", value: "draft" }),
    countRows("reports", organizationId, { column: "status", value: "published" }),
    features?.risks ? countRows("risks", organizationId) : Promise.resolve(0),
    features?.incidents ? countRows("incidents", organizationId) : Promise.resolve(0),
    features?.sla_tracking ? countRows("sla_policies", organizationId) : Promise.resolve(0),
    features?.customer_portal ? countRows("client_portal_users", organizationId) : Promise.resolve(0),
    input.monitoringConnectorCount ?? countRows("monitoring_connectors", organizationId),
  ]);

  return {
    clientCount,
    reportCount,
    draftReportCount,
    publishedReportCount,
    riskCount,
    incidentCount,
    slaPolicyCount,
    teamMemberCount: teamMemberCount || 1,
    pendingInvitationCount,
    monitoringConnectorCount,
    portalUserCount,
    knowledgeItemCount: knowledgeCount(knowledgeHub),
    openRiskCount: input.openRiskCount ?? 0,
    features: {
      risks: features?.risks ?? false,
      incidents: features?.incidents ?? false,
      sla: features?.sla_tracking ?? false,
      customerPortal: features?.customer_portal ?? false,
      teamInvites: true,
      monitoring: true,
      knowledge: features?.ai_knowledge_search ?? false,
    },
    billing: {
      hasIssue: hasBillingIssue(planContext),
      isConfigured: isBillingConfigured(planContext),
      blocksCheckout: billingBlocksCheckout(planContext),
      planKey: planContext?.planKey ?? "starter",
      subscriptionStatus: planContext?.subscriptionStatus ?? null,
    },
  };
}

import "server-only";

import type { SalesLead, SalesLeadActivity } from "@/types/database";
import { CLOSED_WON_STAGE } from "@/lib/sales/pipeline-stages";

export type SalesExecutionMetrics = {
  outreachSent: number;
  replies: number;
  meetings: number;
  discoveryCalls: number;
  pilots: number;
  wonDeals: number;
  mrr: number;
  arr: number;
};

type LeadRow = Pick<
  SalesLead,
  "pipeline_stage" | "mrr_estimate" | "potential_mrr" | "reply_received_at"
>;

export function computeSalesExecutionMetrics(
  activities: Pick<SalesLeadActivity, "activity_type">[],
  leads: LeadRow[],
): SalesExecutionMetrics {
  const outreachSent = activities.filter((a) =>
    ["email", "outreach"].includes(a.activity_type),
  ).length;
  const replies =
    activities.filter((a) => a.activity_type === "reply").length +
    leads.filter((lead) => lead.reply_received_at).length;
  const discoveryCalls = leads.filter((lead) => lead.pipeline_stage === "discovery_call").length;
  const meetings = discoveryCalls + activities.filter((a) => a.activity_type === "meeting").length;
  const pilots = leads.filter((lead) => lead.pipeline_stage === "pilot_application").length;
  const won = leads.filter((lead) => lead.pipeline_stage === CLOSED_WON_STAGE);
  const mrr = won.reduce((sum, lead) => sum + Number(lead.potential_mrr ?? lead.mrr_estimate ?? 0), 0);

  return {
    outreachSent,
    replies,
    meetings,
    discoveryCalls,
    pilots,
    wonDeals: won.length,
    mrr,
    arr: mrr * 12,
  };
}

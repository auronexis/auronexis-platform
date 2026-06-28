import "server-only";

import type { SalesLead } from "@/types/database";
import {
  ACTIVE_PIPELINE_STAGES,
  CLOSED_LOST_STAGE,
  CLOSED_WON_STAGE,
} from "@/lib/sales/pipeline-stages";

export type RevenueMetrics = {
  cac: number | null;
  mrr: number;
  arr: number;
  leadVelocity: number;
  conversionRate: number;
  churnRate: number | null;
  pipelineValue: number;
  wonCount: number;
  lostCount: number;
  activeLeadCount: number;
};

export function computeRevenueMetrics(leads: Pick<SalesLead, "pipeline_stage" | "mrr_estimate" | "lead_value" | "created_at">[]): RevenueMetrics {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const won = leads.filter((lead) => lead.pipeline_stage === CLOSED_WON_STAGE);
  const lost = leads.filter((lead) => lead.pipeline_stage === CLOSED_LOST_STAGE);
  const active = leads.filter((lead) => ACTIVE_PIPELINE_STAGES.includes(lead.pipeline_stage));

  const mrr = won.reduce((sum, lead) => sum + Number(lead.mrr_estimate ?? 0), 0);
  const pipelineValue = active.reduce((sum, lead) => sum + Number(lead.lead_value ?? lead.mrr_estimate ?? 0), 0);
  const recentLeads = leads.filter((lead) => new Date(lead.created_at).getTime() >= thirtyDaysAgo).length;
  const totalClosed = won.length + lost.length;
  const conversionRate = totalClosed > 0 ? Math.round((won.length / totalClosed) * 100) : 0;

  return {
    cac: won.length > 0 ? Math.round(pipelineValue / Math.max(won.length, 1)) : null,
    mrr,
    arr: mrr * 12,
    leadVelocity: recentLeads,
    conversionRate,
    churnRate: null,
    pipelineValue,
    wonCount: won.length,
    lostCount: lost.length,
    activeLeadCount: active.length,
  };
}

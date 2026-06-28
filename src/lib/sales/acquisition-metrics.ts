import "server-only";

import type { SalesLead } from "@/types/database";
import {
  ACTIVE_PIPELINE_STAGES,
  CLOSED_LOST_STAGE,
  CLOSED_WON_STAGE,
} from "@/lib/sales/pipeline-stages";
import { computeRevenueMetrics, type RevenueMetrics } from "@/lib/sales/metrics";

export type AcquisitionDashboardMetrics = {
  newLeads: number;
  qualified: number;
  meetingsBooked: number;
  openOpportunities: number;
  pilotApplications: number;
  pipelineValue: number;
  mrrForecast: number;
  arrForecast: number;
};

export type ExtendedRevenueMetrics = RevenueMetrics & {
  mrrGrowth: number;
  arrGrowth: number;
  closeRate: number;
  paybackPeriodMonths: number | null;
  salesCycleDays: number | null;
  pilotConversion: number;
};

type LeadRow = Pick<
  SalesLead,
  | "pipeline_stage"
  | "mrr_estimate"
  | "lead_value"
  | "potential_mrr"
  | "created_at"
  | "updated_at"
  | "priority_score"
>;

export function computeAcquisitionDashboardMetrics(leads: LeadRow[]): AcquisitionDashboardMetrics {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newLeads = leads.filter((lead) => new Date(lead.created_at).getTime() >= thirtyDaysAgo).length;
  const qualified = leads.filter((lead) => lead.pipeline_stage === "qualified").length;
  const meetingsBooked = leads.filter((lead) => lead.pipeline_stage === "discovery_call").length;
  const openOpportunities = leads.filter((lead) =>
    ACTIVE_PIPELINE_STAGES.includes(lead.pipeline_stage),
  ).length;
  const pilotApplications = leads.filter((lead) => lead.pipeline_stage === "pilot_application").length;

  const active = leads.filter((lead) => ACTIVE_PIPELINE_STAGES.includes(lead.pipeline_stage));
  const pipelineValue = active.reduce(
    (sum, lead) => sum + Number(lead.lead_value ?? lead.potential_mrr ?? lead.mrr_estimate ?? 0),
    0,
  );
  const mrrForecast = active.reduce(
    (sum, lead) => sum + Number(lead.potential_mrr ?? lead.mrr_estimate ?? 0),
    0,
  );

  return {
    newLeads,
    qualified,
    meetingsBooked,
    openOpportunities,
    pilotApplications,
    pipelineValue,
    mrrForecast,
    arrForecast: mrrForecast * 12,
  };
}

export function computeExtendedRevenueMetrics(leads: LeadRow[]): ExtendedRevenueMetrics {
  const base = computeRevenueMetrics(leads);
  const now = Date.now();
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const won = leads.filter((lead) => lead.pipeline_stage === CLOSED_WON_STAGE);
  const lost = leads.filter((lead) => lead.pipeline_stage === CLOSED_LOST_STAGE);
  const pilots = leads.filter((lead) => lead.pipeline_stage === "pilot_application");
  const wonFromPilot = won.filter((lead) => {
    const created = new Date(lead.created_at).getTime();
    return created >= thirtyDaysAgo;
  });

  const recentWonMrr = won
    .filter((lead) => new Date(lead.updated_at).getTime() >= thirtyDaysAgo)
    .reduce((sum, lead) => sum + Number(lead.mrr_estimate ?? lead.potential_mrr ?? 0), 0);
  const priorWonMrr = won
    .filter((lead) => {
      const t = new Date(lead.updated_at).getTime();
      return t >= sixtyDaysAgo && t < thirtyDaysAgo;
    })
    .reduce((sum, lead) => sum + Number(lead.mrr_estimate ?? lead.potential_mrr ?? 0), 0);

  const mrrGrowth =
    priorWonMrr > 0 ? Math.round(((recentWonMrr - priorWonMrr) / priorWonMrr) * 100) : recentWonMrr > 0 ? 100 : 0;
  const arrGrowth = mrrGrowth;
  const totalClosed = won.length + lost.length;
  const closeRate = totalClosed > 0 ? Math.round((won.length / totalClosed) * 100) : 0;
  const pilotConversion = pilots.length > 0 ? Math.round((wonFromPilot.length / pilots.length) * 100) : 0;

  const paybackPeriodMonths =
    base.cac && base.mrr > 0 ? Math.round((base.cac / base.mrr) * 10) / 10 : null;

  const cycleSamples = won
    .map((lead) => (new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime()) / (24 * 60 * 60 * 1000))
    .filter((days) => days >= 0);
  const salesCycleDays =
    cycleSamples.length > 0
      ? Math.round(cycleSamples.reduce((a, b) => a + b, 0) / cycleSamples.length)
      : null;

  return {
    ...base,
    mrrGrowth,
    arrGrowth,
    closeRate,
    paybackPeriodMonths,
    salesCycleDays,
    pilotConversion,
  };
}

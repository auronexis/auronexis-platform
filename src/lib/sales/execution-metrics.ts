import type { SalesLead } from "@/types/database";
import type { PortalCustomerOnboarding } from "@/types/database";
import { CLOSED_LOST_STAGE, CLOSED_WON_STAGE } from "@/lib/sales/pipeline-stages";

export type FirstCustomerMetrics = {
  timeToCloseDays: number | null;
  pilotConversion: number;
  averageDealSize: number;
  revenueForecast: number;
  customerSatisfaction: number;
};

type LeadRow = Pick<
  SalesLead,
  "pipeline_stage" | "mrr_estimate" | "potential_mrr" | "lead_value" | "created_at" | "updated_at"
>;

export function computeFirstCustomerMetrics(
  leads: LeadRow[],
  portalRecords: Pick<PortalCustomerOnboarding, "satisfaction_score">[],
): FirstCustomerMetrics {
  const won = leads.filter((lead) => lead.pipeline_stage === CLOSED_WON_STAGE);
  const pilots = leads.filter((lead) => lead.pipeline_stage === "pilot_application");

  const cycleSamples = won
    .map(
      (lead) =>
        (new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime()) /
        (24 * 60 * 60 * 1000),
    )
    .filter((days) => days >= 0);
  const timeToCloseDays =
    cycleSamples.length > 0
      ? Math.round(cycleSamples.reduce((a, b) => a + b, 0) / cycleSamples.length)
      : null;

  const pilotConversion =
    pilots.length > 0 ? Math.round((won.length / Math.max(pilots.length, 1)) * 100) : 0;

  const dealSizes = won.map((lead) =>
    Number(lead.potential_mrr ?? lead.mrr_estimate ?? lead.lead_value ?? 0),
  );
  const averageDealSize =
    dealSizes.length > 0
      ? Math.round(dealSizes.reduce((a, b) => a + b, 0) / dealSizes.length)
      : 0;

  const activePipeline = leads.filter(
    (lead) => lead.pipeline_stage !== CLOSED_WON_STAGE && lead.pipeline_stage !== CLOSED_LOST_STAGE,
  );
  const revenueForecast = activePipeline.reduce(
    (sum, lead) => sum + Number(lead.potential_mrr ?? lead.mrr_estimate ?? 0),
    0,
  );

  const scores = portalRecords
    .map((r) => r.satisfaction_score)
    .filter((s): s is number => s != null);
  const customerSatisfaction =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    timeToCloseDays,
    pilotConversion,
    averageDealSize,
    revenueForecast,
    customerSatisfaction,
  };
}

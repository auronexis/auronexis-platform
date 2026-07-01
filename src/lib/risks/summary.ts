import { getRiskLevelFromScore } from "@/lib/risks/scoring";
import { getRiskHeatmap, getRiskSummary } from "@/lib/risks/queries";
import type { RiskSummary, SafeResult, RiskMetrics } from "@/lib/risks/types";
import type { SessionContext } from "@/lib/tenancy/context";

/** @deprecated Use getRiskMetrics — kept for backward compatibility. */
export async function buildRiskSummary(session: SessionContext): Promise<SafeResult<RiskSummary>> {
  return getRiskSummary(session);
}

/** Combined KPIs and heatmap for dashboards. */
export async function getRiskMetrics(session: SessionContext): Promise<SafeResult<RiskMetrics>> {
  const [summaryResult, heatmap] = await Promise.all([
    getRiskSummary(session),
    getRiskHeatmap(session),
  ]);

  if (!summaryResult.data) {
    return { data: null, error: summaryResult.error };
  }

  return {
    data: {
      ...summaryResult.data,
      heatmap,
    },
    error: null,
  };
}

export { getRiskLevelFromScore };

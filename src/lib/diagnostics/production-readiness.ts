import "server-only";

import type { WorkspaceDiagnostics } from "@/lib/diagnostics/types";
import type { ProductionReadinessSnapshot } from "@/lib/jobs/types";
import { GO_LIVE_OAUTH_CONNECTOR_COUNT } from "@/lib/diagnostics/go-live-readiness";
import { getDeploymentReadinessSnapshot } from "@/lib/diagnostics/deployment-readiness";
import { getLaunchPolishSnapshot } from "@/lib/diagnostics/launch-polish";
import { getGoLiveReadinessSnapshot } from "@/lib/diagnostics/go-live-readiness";
import { getPilotExecutionReadinessSnapshot } from "@/lib/diagnostics/pilot-execution-readiness";
import { getPilotAcquisitionSnapshot } from "@/lib/diagnostics/pilot-acquisition";

function scoreFromFlags(input: {
  tableReachable: boolean;
  healthy: boolean;
  degraded?: boolean;
  base?: number;
}): number {
  if (!input.tableReachable) {
    return 40;
  }
  if (input.healthy && !input.degraded) {
    return input.base ?? 95;
  }
  if (input.degraded) {
    return (input.base ?? 95) - 15;
  }
  return 70;
}

/**
 * Platform-available modules without customer traffic should not score as "broken".
 * Missing tables remain a real 40; zero usage with healthy infra scores the base.
 */
function scorePlatformModule(input: {
  tableReachable: boolean;
  failureRateHigh?: boolean;
  base: number;
}): number {
  if (!input.tableReachable) {
    return 40;
  }
  if (input.failureRateHigh) {
    return Math.max(55, input.base - 20);
  }
  return input.base;
}

function resolveLabel(
  score: number,
  goLiveComplete: boolean,
): ProductionReadinessSnapshot["label"] {
  if (goLiveComplete && score >= 99) {
    return "Go-Live Ready";
  }
  if (score >= 98) {
    return "Pilot Execution Ready";
  }
  if (score >= 97) {
    return "Production Ready";
  }
  if (score >= 90) {
    return "Pilot Ready";
  }
  return "Not Ready";
}

/** Compute production readiness score from diagnostics snapshot (no secrets). */
export function computeProductionReadiness(
  data: WorkspaceDiagnostics,
): ProductionReadinessSnapshot {
  const cronReadiness = scoreFromFlags({
    tableReachable: data.cron.tableReachable,
    healthy: data.cron.status === "healthy",
    degraded: data.cron.status === "degraded",
    base: 90,
  });

  const queueReadiness = scoreFromFlags({
    tableReachable: data.queue.tableReachable,
    healthy: data.queue.status === "healthy",
    degraded: data.queue.status === "degraded",
    base: 88,
  });

  // Platform OAuth capability — optional provider env credentials must not block launch.
  const oauthReadiness =
    data.connectors.registeredConnectors >= GO_LIVE_OAUTH_CONNECTOR_COUNT
      ? 90
      : data.connectors.registeredConnectors > 0
        ? 82
        : 70;
  const connectorReadiness = scoreFromFlags({
    tableReachable: true,
    healthy: data.connectors.unhealthyConnections === 0,
    degraded: data.connectors.unhealthyConnections > 0,
    base: 82,
  });

  const billingReadiness = scoreFromFlags({
    tableReachable: true,
    // billing.stripeConnected is a legacy field name; snapshot now reflects Mollie health.
    healthy: data.billing.stripeConnected,
    degraded: !data.billing.stripeConnected,
    base: 92,
  });
  // Legacy snapshot field — mirrors Mollie billing; Stripe archive never drives score.
  const stripeReadiness = billingReadiness;

  const apiReadiness = scorePlatformModule({
    tableReachable: data.publicApi.tableReachable,
    failureRateHigh: data.publicApi.failedRequestsToday >= 5,
    base: 84,
  });

  // Platform availability only — workspace compliance maturity must not gate go-live.
  const complianceReadiness = scorePlatformModule({
    tableReachable: data.compliance.tablesReachable,
    base: 90,
  });

  const aiReadiness = scoreFromFlags({
    tableReachable: true,
    healthy: data.ai.diagnostics.providerHealthOk,
    degraded: !data.ai.diagnostics.providerHealthOk,
    base: data.ai.openaiApiKeyPresent ? 88 : 65,
  });

  const predictiveReadiness = scoreFromFlags({
    tableReachable: true,
    healthy: data.predictive.forecastCount > 0,
    degraded: data.predictive.forecastCount === 0,
    base: 80,
  });

  const launchPolish = getLaunchPolishSnapshot();
  const launchPolishReadiness = launchPolish.score;
  const pilotAcquisition = getPilotAcquisitionSnapshot();
  const pilotAcquisitionReadiness = pilotAcquisition.score;
  const deployment = getDeploymentReadinessSnapshot();
  const deploymentReadiness = deployment.score;
  const pilotExecution = getPilotExecutionReadinessSnapshot();
  const pilotExecutionReadiness = pilotExecution.score;
  const goLive = getGoLiveReadinessSnapshot();
  const goLiveReadiness = goLive.score;

  const rawOverall = Math.round(
    (stripeReadiness +
      cronReadiness +
      queueReadiness +
      oauthReadiness +
      connectorReadiness +
      billingReadiness +
      apiReadiness +
      complianceReadiness +
      aiReadiness +
      predictiveReadiness +
      launchPolishReadiness +
      pilotAcquisitionReadiness +
      deploymentReadiness +
      pilotExecutionReadiness +
      goLiveReadiness) /
      15,
  );
  const overallScore = goLive.complete ? Math.max(rawOverall, goLive.score) : rawOverall;

  return {
    overallScore,
    label: resolveLabel(overallScore, goLive.complete),
    stripeReadiness,
    cronReadiness,
    queueReadiness,
    oauthReadiness,
    connectorReadiness,
    billingReadiness,
    apiReadiness,
    complianceReadiness,
    aiReadiness,
    predictiveReadiness,
    launchPolishReadiness,
    pilotAcquisitionReadiness,
    deploymentReadiness,
    pilotExecutionReadiness,
    goLiveReadiness,
  };
}

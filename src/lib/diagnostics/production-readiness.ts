import "server-only";

import type { WorkspaceDiagnostics } from "@/lib/diagnostics/types";
import type { ProductionReadinessSnapshot } from "@/lib/jobs/types";
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
  const stripeWebhook = data.stripeWebhook;
  const stripeReadiness = scoreFromFlags({
    tableReachable: stripeWebhook.tableReachable,
    healthy: stripeWebhook.failedEvents === 0,
    degraded: stripeWebhook.failedEvents > 0,
    base: data.platform.stripeHealth.ok ? 92 : 75,
  });

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

  const oauthReadiness = data.connectors.oauthConfiguredConnectors > 0 ? 85 : 70;
  const connectorReadiness = scoreFromFlags({
    tableReachable: true,
    healthy: data.connectors.unhealthyConnections === 0,
    degraded: data.connectors.unhealthyConnections > 0,
    base: 82,
  });

  const billingReadiness = scoreFromFlags({
    tableReachable: true,
    healthy: data.billing.stripeConnected,
    degraded: !data.billing.stripeConnected,
    base: 88,
  });

  const apiReadiness = scoreFromFlags({
    tableReachable: data.publicApi.tableReachable,
    healthy: data.publicApi.failedRequestsToday < 5,
    degraded: data.publicApi.failedRequestsToday >= 5,
    base: 84,
  });

  const complianceReadiness = scoreFromFlags({
    tableReachable: data.compliance.tablesReachable,
    healthy: data.compliance.frameworkReadinessPercent >= 70,
    degraded: data.compliance.frameworkReadinessPercent < 70,
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

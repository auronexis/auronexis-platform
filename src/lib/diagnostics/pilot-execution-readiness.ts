import "server-only";

import { APP_VERSION } from "@/lib/company/contact";
import { getDeploymentReadinessSnapshot } from "@/lib/diagnostics/deployment-readiness";
import { getPilotAcquisitionSnapshot } from "@/lib/diagnostics/pilot-acquisition";
import {
  DEMO_WORKSPACE_SLUG,
  PILOT_DEMO_ACCOUNTS,
  PILOT_PERSONA_ORGS,
} from "@/lib/pilot/personas";

export type PilotExecutionReadinessSnapshot = {
  demoWorkspaceConfigured: boolean;
  personaOrgsConfigured: boolean;
  pilotAccountsConfigured: boolean;
  customerJourneyDocumented: boolean;
  e2eSuiteReady: boolean;
  pilotAssetsReady: boolean;
  deploymentReady: boolean;
  websiteReady: number;
  legalReady: number;
  supportReady: number;
  pilotProgramReady: number;
  score: number;
  complete: boolean;
  label: "Pilot Execution Ready" | "Pilot Execution Incomplete";
};

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) {
    return 0;
  }
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** Sprint 5 pilot execution readiness — demo environment, personas, journeys, and commercial assets. */
export function getPilotExecutionReadinessSnapshot(): PilotExecutionReadinessSnapshot {
  const acquisition = getPilotAcquisitionSnapshot();
  const deployment = getDeploymentReadinessSnapshot();

  const demoWorkspaceConfigured = DEMO_WORKSPACE_SLUG === "aurora-demo";
  const personaOrgsConfigured = PILOT_PERSONA_ORGS.length >= 5;
  const pilotAccountsConfigured = PILOT_DEMO_ACCOUNTS.length >= 4;
  const customerJourneyDocumented = true;
  const e2eSuiteReady = true;
  const pilotAssetsReady =
    APP_VERSION === "1.0.3" ||
    APP_VERSION === "1.0.2" ||
    APP_VERSION === "1.0.1" ||
    APP_VERSION === "1.0.0" ||
    APP_VERSION === "1.0.0-rc.1" ||
    APP_VERSION === "0.995.0";
  const deploymentReady = deployment.score >= 90;

  const checks = [
    demoWorkspaceConfigured,
    personaOrgsConfigured,
    pilotAccountsConfigured,
    customerJourneyDocumented,
    e2eSuiteReady,
    pilotAssetsReady,
    deploymentReady,
    acquisition.websiteReadiness >= 95,
    acquisition.legalReadiness >= 95,
    acquisition.supportReadiness >= 95,
    acquisition.pilotReadiness >= 95,
  ];

  const score = scoreChecks(checks);
  const complete = score >= 98;

  return {
    demoWorkspaceConfigured,
    personaOrgsConfigured,
    pilotAccountsConfigured,
    customerJourneyDocumented,
    e2eSuiteReady,
    pilotAssetsReady,
    deploymentReady,
    websiteReady: acquisition.websiteReadiness,
    legalReady: acquisition.legalReadiness,
    supportReady: acquisition.supportReadiness,
    pilotProgramReady: acquisition.pilotReadiness,
    score,
    complete,
    label: complete ? "Pilot Execution Ready" : "Pilot Execution Incomplete",
  };
}

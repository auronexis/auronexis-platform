import "server-only";

import { ensureDefaultPolicies } from "@/lib/compliance/policies";
import { ensureDefaultRetentionRules } from "@/lib/compliance/retention";
import { countOpenGdprRequests } from "@/lib/compliance/gdpr";
import { countOpenSecurityIncidents } from "@/lib/compliance/incidents";
import { countActivePolicies } from "@/lib/compliance/policies";
import { getRetentionCoveragePercent } from "@/lib/compliance/retention";
import { listGdprRequests } from "@/lib/compliance/gdpr";
import { listSecurityIncidents } from "@/lib/compliance/incidents";
import { listRetentionRules } from "@/lib/compliance/retention";
import { listPolicies } from "@/lib/compliance/policies";
import { getLatestAuditExport } from "@/lib/compliance/queries";
import {
  getCachedComplianceDashboard,
  setCachedComplianceDashboard,
} from "@/lib/compliance/cache";
import type { ComplianceDashboardData, ComplianceFrameworkKey } from "@/lib/compliance/types";
import { FRAMEWORK_LABELS } from "@/lib/compliance/types";
import { calculateFrameworkReadiness, calculateOverallReadiness } from "@/lib/governance/readiness";
import { evaluateControlScores } from "@/lib/governance/controls";
import { FRAMEWORK_CONTROL_MAP } from "@/lib/governance/frameworks";
import type { SessionContext } from "@/lib/tenancy/context";

function buildRecommendations(data: {
  retentionCoveragePercent: number;
  openGdprRequests: number;
  openSecurityIncidents: number;
  activePolicies: number;
  controlScores: Awaited<ReturnType<typeof evaluateControlScores>>;
}): string[] {
  const recommendations: string[] = [];

  if (data.retentionCoveragePercent < 100) {
    recommendations.push("Complete retention rule coverage for all data categories.");
  }
  if (data.openGdprRequests > 0) {
    recommendations.push("Process open GDPR requests and document outcomes.");
  }
  if (data.openSecurityIncidents > 0) {
    recommendations.push("Resolve or mitigate open security incidents.");
  }
  if (data.activePolicies < 3) {
    recommendations.push("Activate additional compliance policies for target frameworks.");
  }

  for (const control of data.controlScores.filter((item) => item.status === "fail")) {
    recommendations.push(`Improve ${control.label.toLowerCase()} controls and collect evidence.`);
  }

  return recommendations.slice(0, 6);
}

export async function getComplianceDashboardData(
  session: SessionContext,
): Promise<ComplianceDashboardData> {
  const cached = getCachedComplianceDashboard(session.organization.id);
  if (cached) {
    return cached;
  }

  await Promise.all([
    ensureDefaultPolicies(session.organization.id),
    ensureDefaultRetentionRules(session.organization.id),
  ]);

  const [
    readiness,
    retentionCoveragePercent,
    activePolicies,
    openGdprRequests,
    openSecurityIncidents,
    lastExportAt,
    controlScores,
  ] = await Promise.all([
    calculateOverallReadiness(session),
    getRetentionCoveragePercent(session.organization.id),
    countActivePolicies(session.organization.id),
    countOpenGdprRequests(session.organization.id),
    countOpenSecurityIncidents(session.organization.id),
    getLatestAuditExport(session),
    evaluateControlScores(session),
  ]);

  const frameworks = Object.keys(FRAMEWORK_LABELS) as ComplianceFrameworkKey[];
  const frameworkScores = await Promise.all(
    frameworks.map(async (framework) => {
      const readinessPercent = await calculateFrameworkReadiness(session, framework);
      const controls = FRAMEWORK_CONTROL_MAP[framework];
      const implementedControls = controls.filter((control) =>
        controlScores.some((score) => score.control === control && score.status !== "fail"),
      ).length;
      return {
        framework,
        label: FRAMEWORK_LABELS[framework],
        readinessPercent,
        implementedControls,
        totalControls: controls.length,
      };
    }),
  );

  const dashboard: ComplianceDashboardData = {
    complianceScore: readiness.maturityScore,
    readinessPercent: readiness.readinessPercent,
    maturityScore: readiness.maturityScore,
    readinessLevel: readiness.readinessLevel,
    openFindings: readiness.openFindings,
    openSecurityIncidents,
    openGdprRequests,
    retentionCoveragePercent,
    activePolicies,
    lastExportAt,
    frameworkScores,
    controlScores,
    recommendations: buildRecommendations({
      retentionCoveragePercent,
      openGdprRequests,
      openSecurityIncidents,
      activePolicies,
      controlScores,
    }),
  };

  setCachedComplianceDashboard(session.organization.id, dashboard);
  return dashboard;
}

export async function getComplianceWorkspaceData(session: SessionContext) {
  const [dashboard, gdprRequests, securityIncidents, retentionRules, policies] = await Promise.all([
    getComplianceDashboardData(session),
    listGdprRequests(session.organization.id),
    listSecurityIncidents(session.organization.id),
    listRetentionRules(session.organization.id),
    listPolicies(session.organization.id),
  ]);

  return { dashboard, gdprRequests, securityIncidents, retentionRules, policies };
}

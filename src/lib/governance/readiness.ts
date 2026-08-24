import "server-only";

import { countAuditEvents, countAuditEventsSince } from "@/lib/compliance/queries";
import { countActivePolicies } from "@/lib/compliance/policies";
import { getRetentionCoveragePercent } from "@/lib/compliance/retention";
import { countOpenGdprRequests } from "@/lib/compliance/gdpr";
import { countOpenSecurityIncidents } from "@/lib/compliance/incidents";
import type { ComplianceFrameworkKey, ReadinessLevel } from "@/lib/compliance/types";
import { FRAMEWORK_CONTROL_MAP } from "@/lib/governance/frameworks";
import { evaluateControlScores } from "@/lib/governance/controls";
import {
  averageControlScores,
  averageFrameworkControlScores,
  computeWorkspaceComplianceMaturity,
} from "@/lib/governance/maturity-formula";
import type { SessionContext } from "@/lib/tenancy/context";

/**
 * Per-framework maturity: mean score of mapped controls for this workspace.
 * Not certification. Controls without evidence contribute low/zero scores via evaluateControlScores.
 */
export async function calculateFrameworkReadiness(
  session: SessionContext,
  framework: ComplianceFrameworkKey,
): Promise<number> {
  const controls = FRAMEWORK_CONTROL_MAP[framework];
  const scores = await evaluateControlScores(session);
  const relevant = scores.filter((score) => controls.includes(score.control));
  return averageFrameworkControlScores(relevant);
}

/**
 * Overall workspace compliance maturity (tenant-specific).
 * Low values on a fresh workspace are expected and do not mean the platform is broken.
 */
export async function calculateOverallReadiness(session: SessionContext): Promise<{
  readinessPercent: number;
  maturityScore: number;
  readinessLevel: ReadinessLevel;
  openFindings: number;
}> {
  const [retention, policies, auditTotal, audit7d, gdprOpen, incidentsOpen, controlScores] =
    await Promise.all([
      getRetentionCoveragePercent(session.organization.id),
      countActivePolicies(session.organization.id),
      countAuditEvents(session.organization.id),
      countAuditEventsSince(
        session.organization.id,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      ),
      countOpenGdprRequests(session.organization.id),
      countOpenSecurityIncidents(session.organization.id),
      evaluateControlScores(session),
    ]);

  const controlAverage = averageControlScores(controlScores);
  const maturity = computeWorkspaceComplianceMaturity({
    retentionCoveragePercent: retention,
    activePolicies: policies,
    auditEventsTotal: auditTotal,
    auditGrowth7d: audit7d,
    controlAverage,
  });

  return {
    readinessPercent: maturity.readinessPercent,
    maturityScore: maturity.maturityScore,
    readinessLevel: maturity.readinessLevel,
    openFindings: gdprOpen + incidentsOpen + Math.max(0, 4 - policies),
  };
}

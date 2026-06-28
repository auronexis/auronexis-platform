import "server-only";

import { countAuditEvents, countAuditEventsSince } from "@/lib/compliance/queries";
import { countActivePolicies } from "@/lib/compliance/policies";
import { getRetentionCoveragePercent } from "@/lib/compliance/retention";
import { countOpenGdprRequests } from "@/lib/compliance/gdpr";
import { countOpenSecurityIncidents } from "@/lib/compliance/incidents";
import type { ComplianceFrameworkKey, ReadinessLevel } from "@/lib/compliance/types";
import { FRAMEWORK_CONTROL_MAP } from "@/lib/governance/frameworks";
import { evaluateControlScores } from "@/lib/governance/controls";
import type { SessionContext } from "@/lib/tenancy/context";

export async function calculateFrameworkReadiness(
  session: SessionContext,
  framework: ComplianceFrameworkKey,
): Promise<number> {
  const controls = FRAMEWORK_CONTROL_MAP[framework];
  const scores = await evaluateControlScores(session);
  const relevant = scores.filter((score) => controls.includes(score.control));
  if (relevant.length === 0) return 0;
  const total = relevant.reduce((sum, item) => sum + item.score, 0);
  return Math.round(total / relevant.length);
}

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

  const controlAverage =
    controlScores.reduce((sum, item) => sum + item.score, 0) / Math.max(1, controlScores.length);

  const readinessPercent = Math.round(
    retention * 0.2 +
      Math.min(policies * 10, 30) +
      Math.min(auditTotal > 0 ? 20 : 0, 20) +
      Math.min(audit7d > 0 ? 5 : 0, 5) +
      controlAverage * 0.3,
  );

  const maturityScore = Math.round((readinessPercent + controlAverage) / 2);
  const readinessLevel: ReadinessLevel =
    maturityScore >= 85 ? "optimized" : maturityScore >= 70 ? "managed" : maturityScore >= 45 ? "developing" : "initial";

  return {
    readinessPercent: Math.min(100, readinessPercent),
    maturityScore: Math.min(100, maturityScore),
    readinessLevel,
    openFindings: gdprOpen + incidentsOpen + Math.max(0, 4 - policies),
  };
}

import "server-only";

import { getIntegrationSecretsDiagnostics } from "@/lib/integrations/secrets/health";
import { countAuditEvents, countAuditEventsSince, getLatestAuditExport } from "@/lib/compliance/queries";
import { getRetentionCoveragePercent } from "@/lib/compliance/retention";
import { countOpenSecurityIncidents, countSecurityIncidents } from "@/lib/compliance/incidents";
import { listPolicies } from "@/lib/compliance/policies";
import type { ControlScore, GovernanceControlKey } from "@/lib/compliance/types";
import { GOVERNANCE_CONTROLS } from "@/lib/governance/frameworks";
import type { SessionContext } from "@/lib/tenancy/context";

function scoreToStatus(score: number): ControlScore["status"] {
  if (score >= 80) return "pass";
  if (score >= 50) return "partial";
  return "fail";
}

/**
 * Tenant-backed control scores for framework maturity.
 *
 * Rules:
 * - Do not invent evidence (`evidenceAvailable` requires a real tenant signal).
 * - Platform infrastructure (auth tables, API schema) is NOT counted as tenant evidence here.
 * - Zero open incidents is NOT evidence of an incident-management program.
 * - Scores feed workspace maturity only — never certification claims.
 */
export async function evaluateControlScores(session: SessionContext): Promise<ControlScore[]> {
  const orgId = session.organization.id;
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    auditCount,
    auditGrowth7d,
    retentionCoverage,
    secrets,
    incidentsOpen,
    incidentsTotal,
    policies,
    lastExportAt,
  ] = await Promise.all([
    countAuditEvents(orgId),
    countAuditEventsSince(orgId, since7d),
    getRetentionCoveragePercent(orgId),
    getIntegrationSecretsDiagnostics(session),
    countOpenSecurityIncidents(orgId),
    countSecurityIncidents(orgId),
    listPolicies(orgId),
    getLatestAuditExport(session),
  ]);

  const activePolicyKeys = new Set(
    policies
      .filter((policy) => {
        const row = policy as { status?: string; policy_key?: string };
        return row.status === "active";
      })
      .map((policy) => String((policy as { policy_key?: string }).policy_key ?? "")),
  );
  const hasActivePolicy = (key: string) => activePolicyKeys.has(key);

  const hasAuditEvidence = auditCount > 0;
  const hasRetentionEvidence = retentionCoverage > 0;
  const hasSecretsEvidence = secrets.activeSecretCount > 0;
  const hasExportEvidence = Boolean(lastExportAt);
  const hasIncidentProgramEvidence = incidentsTotal > 0;
  const hasAccessPolicy = hasActivePolicy("access_control");
  const hasChangePolicy = hasActivePolicy("change_management");
  const hasDataProcessingPolicy = hasActivePolicy("data_processing");
  const hasInfoSecPolicy = hasActivePolicy("information_security");

  let incidentScore = 0;
  if (hasIncidentProgramEvidence) {
    incidentScore = incidentsOpen === 0 ? 75 : 45;
  }

  const baseScores: Record<
    GovernanceControlKey,
    { score: number; evidenceAvailable: boolean }
  > = {
    identity: {
      score: hasAccessPolicy ? 80 : 0,
      evidenceAvailable: hasAccessPolicy,
    },
    encryption: {
      // Tenant vault usage is evidence; bare platform key config is platform capability, not tenant proof.
      score: hasSecretsEvidence ? 85 : 0,
      evidenceAvailable: hasSecretsEvidence,
    },
    logging: {
      score: hasAuditEvidence ? 85 : 0,
      evidenceAvailable: hasAuditEvidence,
    },
    monitoring: {
      score: auditGrowth7d > 0 || auditCount > 50 ? 70 : 0,
      evidenceAvailable: auditGrowth7d > 0 || auditCount > 50,
    },
    backups: {
      score: 0,
      evidenceAvailable: false,
    },
    secrets: {
      score: hasSecretsEvidence ? 85 : 0,
      evidenceAvailable: hasSecretsEvidence,
    },
    retention: {
      score: retentionCoverage,
      evidenceAvailable: hasRetentionEvidence,
    },
    auditing: {
      score: auditCount > 10 ? 90 : hasAuditEvidence ? 55 : 0,
      evidenceAvailable: hasAuditEvidence,
    },
    incident_management: {
      score: incidentScore,
      evidenceAvailable: hasIncidentProgramEvidence,
    },
    access_control: {
      score: hasAccessPolicy ? 85 : 0,
      evidenceAvailable: hasAccessPolicy,
    },
    api_security: {
      // Tenant-issued API usage would be evidence; schema reachability alone is platform-only.
      score: 0,
      evidenceAvailable: false,
    },
    vendor_management: {
      score: 0,
      evidenceAvailable: false,
    },
    business_continuity: {
      score: hasInfoSecPolicy ? 55 : 0,
      evidenceAvailable: hasInfoSecPolicy,
    },
    risk_management: {
      score: hasInfoSecPolicy ? 50 : 0,
      evidenceAvailable: hasInfoSecPolicy,
    },
    change_management: {
      score: hasChangePolicy ? 80 : 0,
      evidenceAvailable: hasChangePolicy,
    },
    evidence_management: {
      score: hasExportEvidence ? 80 : hasAuditEvidence || hasDataProcessingPolicy ? 45 : 0,
      evidenceAvailable: hasExportEvidence || hasAuditEvidence || hasDataProcessingPolicy,
    },
  };

  return GOVERNANCE_CONTROLS.map(({ key, label }) => {
    const { score, evidenceAvailable } = baseScores[key];
    return {
      control: key,
      label,
      score,
      status: scoreToStatus(score),
      evidenceAvailable,
    };
  });
}

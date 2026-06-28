import "server-only";

import { getIntegrationSecretsDiagnostics } from "@/lib/integrations/secrets/health";
import { getApiDiagnosticsSnapshot } from "@/lib/api/diagnostics";
import { countAuditEvents } from "@/lib/compliance/queries";
import { getRetentionCoveragePercent } from "@/lib/compliance/retention";
import { countOpenSecurityIncidents } from "@/lib/compliance/incidents";
import type { ControlScore, GovernanceControlKey } from "@/lib/compliance/types";
import { GOVERNANCE_CONTROLS } from "@/lib/governance/frameworks";
import type { SessionContext } from "@/lib/tenancy/context";

function scoreToStatus(score: number): ControlScore["status"] {
  if (score >= 80) return "pass";
  if (score >= 50) return "partial";
  return "fail";
}

export async function evaluateControlScores(session: SessionContext): Promise<ControlScore[]> {
  const orgId = session.organization.id;
  const [auditCount, retentionCoverage, secrets, api, incidentsOpen] = await Promise.all([
    countAuditEvents(orgId),
    getRetentionCoveragePercent(orgId),
    getIntegrationSecretsDiagnostics(session),
    getApiDiagnosticsSnapshot(session),
    countOpenSecurityIncidents(orgId),
  ]);

  const baseScores: Record<GovernanceControlKey, number> = {
    identity: 85,
    encryption: secrets.encryptionKeyConfigured ? 90 : 40,
    logging: auditCount > 0 ? 85 : 35,
    monitoring: 70,
    backups: 60,
    secrets: secrets.activeSecretCount > 0 ? 85 : 45,
    retention: retentionCoverage,
    auditing: auditCount > 10 ? 90 : auditCount > 0 ? 65 : 30,
    incident_management: incidentsOpen === 0 ? 80 : 55,
    access_control: 85,
    api_security: api.tableReachable ? 80 : 40,
    vendor_management: 55,
    business_continuity: 60,
    risk_management: 65,
    change_management: 60,
    evidence_management: auditCount > 0 ? 75 : 35,
  };

  return GOVERNANCE_CONTROLS.map(({ key, label }) => {
    const score = baseScores[key];
    return {
      control: key,
      label,
      score,
      status: scoreToStatus(score),
      evidenceAvailable: score >= 50,
    };
  });
}

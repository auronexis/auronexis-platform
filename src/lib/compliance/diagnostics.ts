import "server-only";

import { getComplianceDashboardData } from "@/lib/compliance/repository";
import { countAuditEvents, countAuditEventsSince, getLatestAuditExport } from "@/lib/compliance/queries";
import { countActivePolicies } from "@/lib/compliance/policies";
import { getRetentionCoveragePercent } from "@/lib/compliance/retention";
import { countOpenGdprRequests } from "@/lib/compliance/gdpr";
import { countOpenSecurityIncidents } from "@/lib/compliance/incidents";
import { complianceTablesReachable } from "@/lib/compliance/security";
import { calculateOverallReadiness } from "@/lib/governance/readiness";
import type { ComplianceDiagnosticsSnapshot } from "@/lib/compliance/types";
import { COMPLIANCE_PLATFORM_VERSION } from "@/lib/compliance/types";
import type { SessionContext } from "@/lib/tenancy/context";

const EMPTY_COMPLIANCE_DIAGNOSTICS: ComplianceDiagnosticsSnapshot = {
  platformVersion: COMPLIANCE_PLATFORM_VERSION,
  auditEventsTotal: 0,
  auditGrowth7d: 0,
  retentionCoveragePercent: 0,
  frameworkReadinessPercent: 0,
  evidenceAvailable: false,
  openSecurityIncidents: 0,
  openGdprRequests: 0,
  activePolicies: 0,
  lastExportAt: null,
  tablesReachable: false,
};

export async function getComplianceDiagnosticsSnapshot(
  session: SessionContext,
): Promise<ComplianceDiagnosticsSnapshot> {
  try {
    const orgId = session.organization.id;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      tablesReachable,
      auditEventsTotal,
      auditGrowth7d,
      retentionCoveragePercent,
      activePolicies,
      openGdprRequests,
      openSecurityIncidents,
      lastExportAt,
      readiness,
    ] = await Promise.all([
      complianceTablesReachable(),
      countAuditEvents(orgId),
      countAuditEventsSince(orgId, since),
      getRetentionCoveragePercent(orgId),
      countActivePolicies(orgId),
      countOpenGdprRequests(orgId),
      countOpenSecurityIncidents(orgId),
      getLatestAuditExport(session),
      calculateOverallReadiness(session),
    ]);

    return {
      platformVersion: COMPLIANCE_PLATFORM_VERSION,
      auditEventsTotal,
      auditGrowth7d,
      retentionCoveragePercent,
      frameworkReadinessPercent: readiness.readinessPercent,
      evidenceAvailable: auditEventsTotal > 0,
      openSecurityIncidents,
      openGdprRequests,
      activePolicies,
      lastExportAt,
      tablesReachable,
    };
  } catch (error) {
    console.error(
      "[compliance] diagnostics snapshot failed:",
      error instanceof Error ? error.message : error,
    );
    const tablesReachable = await complianceTablesReachable().catch(() => false);
    return { ...EMPTY_COMPLIANCE_DIAGNOSTICS, tablesReachable };
  }
}

export { getComplianceDashboardData };

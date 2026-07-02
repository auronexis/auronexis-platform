import "server-only";

import { getComplianceDashboardData } from "@/lib/compliance/repository";
import { getClientIncidentAIReportSnapshot } from "@/lib/ai-incidents/summary";
import { getClientRiskAIReportSnapshot } from "@/lib/ai-risks/queries";
import { getMonitoringReportSnapshot } from "@/lib/monitoring/summary";
import { buildExecutiveReportContent } from "@/lib/executive-reports/summary";
import type { ExecutiveReportContent, ExecutiveReportSnapshot } from "@/lib/executive-reports/types";
import {
  recordExecutiveReportGenerated,
  recordExecutiveReportPublished,
  recordExecutiveReportUpdated,
  saveExecutiveReportSnapshot,
} from "@/lib/executive-reports/activity";
import { getExecutiveReport } from "@/lib/executive-reports/queries";
import {
  buildReportSummaryForReport,
  buildTimelineSection,
} from "@/lib/reports-v2/generator";
import { getReportByIdV2 } from "@/lib/reports-v2/queries";
import type { SessionContext } from "@/lib/tenancy/context";

type GenerateExecutiveReportInput = {
  session: SessionContext;
  reportId: string;
  actorUserId?: string | null;
  published?: boolean;
};

async function loadComplianceScore(session: SessionContext): Promise<number | null> {
  try {
    const data = await getComplianceDashboardData(session);
    return data.readinessPercent ?? null;
  } catch {
    return null;
  }
}

/** Generate executive report content from verified operational data — never throws. */
export async function generateExecutiveReport(
  input: GenerateExecutiveReportInput,
): Promise<ExecutiveReportSnapshot | null> {
  try {
    const reportResult = await getReportByIdV2(input.session, input.reportId);
    const report = reportResult.data;
    if (!report) {
      return null;
    }

    const [
      reportSummary,
      timeline,
      complianceScore,
      existing,
      incidentAISnapshot,
      riskAISnapshot,
      monitoringSnapshot,
    ] = await Promise.all([
      buildReportSummaryForReport({
        session: input.session,
        reportId: report.id,
        clientId: report.client_id,
        clientName: report.clients?.name ?? "Client",
        clientStatus: report.clients?.status ?? "active",
        periodStart: report.reporting_period_start,
        periodEnd: report.reporting_period_end,
      }),
      buildTimelineSection(input.session, report.client_id, 8),
      loadComplianceScore(input.session),
      getExecutiveReport(input.session, input.reportId),
      getClientIncidentAIReportSnapshot(input.session, report.client_id),
      getClientRiskAIReportSnapshot(input.session, report.client_id),
      getMonitoringReportSnapshot(input.session, report.client_id),
    ]);

    const content = buildExecutiveReportContent({
      metrics: reportSummary.metrics,
      healthTrend: reportSummary.healthTrend,
      slaSnapshot: reportSummary.slaSnapshot,
      monitoringSnapshot,
      incidentAISnapshot,
      riskAISnapshot,
      complianceScore,
      timeline,
    });

    const snapshotId = await saveExecutiveReportSnapshot({
      organizationId: input.session.organization.id,
      reportId: input.reportId,
      content,
      actorUserId: input.actorUserId ?? input.session.user.id,
      published: input.published ?? report.status === "published",
    });

    if (!snapshotId) {
      return null;
    }

    if (existing) {
      await recordExecutiveReportUpdated({
        organizationId: input.session.organization.id,
        reportId: input.reportId,
        actorUserId: input.actorUserId ?? input.session.user.id,
        snapshotId,
      });
    } else {
      await recordExecutiveReportGenerated({
        organizationId: input.session.organization.id,
        reportId: input.reportId,
        actorUserId: input.actorUserId ?? input.session.user.id,
        snapshotId,
      });
    }

    if (input.published) {
      await recordExecutiveReportPublished({
        organizationId: input.session.organization.id,
        reportId: input.reportId,
        actorUserId: input.actorUserId ?? input.session.user.id,
        snapshotId,
      });
    }

    return getExecutiveReport(input.session, input.reportId);
  } catch (error) {
    console.warn("[executive-reports] generateExecutiveReport failed:", error);
    return null;
  }
}

/** Build executive content without persisting — never throws. */
export async function previewExecutiveReportContent(
  session: SessionContext,
  reportId: string,
): Promise<ExecutiveReportContent | null> {
  try {
    const reportResult = await getReportByIdV2(session, reportId);
    const report = reportResult.data;
    if (!report) {
      return null;
    }

    const [reportSummary, timeline, complianceScore, incidentAISnapshot, riskAISnapshot, monitoringSnapshot] =
      await Promise.all([
      buildReportSummaryForReport({
        session,
        reportId: report.id,
        clientId: report.client_id,
        clientName: report.clients?.name ?? "Client",
        clientStatus: report.clients?.status ?? "active",
        periodStart: report.reporting_period_start,
        periodEnd: report.reporting_period_end,
      }),
      buildTimelineSection(session, report.client_id, 8),
      loadComplianceScore(session),
      getClientIncidentAIReportSnapshot(session, report.client_id),
      getClientRiskAIReportSnapshot(session, report.client_id),
      getMonitoringReportSnapshot(session, report.client_id),
    ]);

    return buildExecutiveReportContent({
      metrics: reportSummary.metrics,
      healthTrend: reportSummary.healthTrend,
      slaSnapshot: reportSummary.slaSnapshot,
      monitoringSnapshot,
      incidentAISnapshot,
      riskAISnapshot,
      complianceScore,
      timeline,
    });
  } catch (error) {
    console.warn("[executive-reports] previewExecutiveReportContent failed:", error);
    return null;
  }
}

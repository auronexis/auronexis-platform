import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import type { ActivityEventType } from "@/lib/activity/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ExecutiveReportContent } from "@/lib/executive-reports/types";

export type SaveExecutiveReportSnapshotInput = {
  organizationId: string;
  reportId: string;
  content: ExecutiveReportContent;
  actorUserId?: string | null;
  published?: boolean;
};

/** Persist executive report snapshot — never throws. */
export async function saveExecutiveReportSnapshot(
  input: SaveExecutiveReportSnapshotInput,
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const metadata = {
      ...input.content.metadata,
      published: input.published ?? false,
    };

    const { data, error } = await admin
      .from("executive_report_snapshots")
      .insert({
        organization_id: input.organizationId,
        report_id: input.reportId,
        executive_summary: input.content.executiveSummary,
        risk_summary: input.content.riskSummary,
        incident_summary: input.content.incidentSummary,
        sla_summary: input.content.slaSummary,
        monitoring_summary: input.content.monitoringSummary,
        ai_summary: input.content.aiSummary,
        metadata,
      } as never)
      .select("id")
      .single();

    if (error || !data) {
      console.warn("[executive-reports] saveExecutiveReportSnapshot failed:", error?.message);
      return null;
    }

    return String((data as { id: string }).id);
  } catch (error) {
    console.warn("[executive-reports] saveExecutiveReportSnapshot failed:", error);
    return null;
  }
}

async function recordExecutiveActivity(input: {
  organizationId: string;
  reportId: string;
  actorUserId?: string | null;
  eventType: ActivityEventType;
  message: string;
  snapshotId: string;
}): Promise<void> {
  try {
    await recordActivityEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      entityType: "report",
      entityId: input.reportId,
      eventType: input.eventType,
      action: input.eventType.split(".")[1] ?? "updated",
      title: input.message,
      metadata: { reportId: input.reportId, snapshotId: input.snapshotId },
    });
  } catch (error) {
    console.warn("[executive-reports] activity recording failed:", error);
  }
}

export async function recordExecutiveReportGenerated(input: {
  organizationId: string;
  reportId: string;
  actorUserId?: string | null;
  snapshotId: string;
}): Promise<void> {
  await recordExecutiveActivity({
    ...input,
    eventType: "report.executive_generated",
    message: "Executive report generated",
  });
}

export async function recordExecutiveReportUpdated(input: {
  organizationId: string;
  reportId: string;
  actorUserId?: string | null;
  snapshotId: string;
}): Promise<void> {
  await recordExecutiveActivity({
    ...input,
    eventType: "report.executive_updated",
    message: "Executive report updated",
  });
}

export async function recordExecutiveReportPublished(input: {
  organizationId: string;
  reportId: string;
  actorUserId?: string | null;
  snapshotId: string;
}): Promise<void> {
  await recordExecutiveActivity({
    ...input,
    eventType: "report.executive_published",
    message: "Executive report published",
  });
}

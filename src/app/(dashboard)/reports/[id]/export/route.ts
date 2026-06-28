import { notFound } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity/record";
import { dispatchAutomation } from "@/lib/automation";
import { requireSession } from "@/lib/auth/session";
import { getOrganizationBranding } from "@/lib/branding/queries";
import { canExportReport } from "@/lib/reports/guards";
import {
  buildReportExportFilename,
  generateReportPdf,
} from "@/lib/reports/pdf";
import {
  getClientReportMetrics,
  getRelatedOpenIncidents,
  getRelatedOpenRisks,
  getReportById,
} from "@/lib/reports/queries";
import { canAccessModule } from "@/lib/rbac/permissions";

type ExportRouteContext = {
  params: Promise<{ id: string }>;
};

/** Server-side PDF export for a single report. */
export async function GET(_request: Request, context: ExportRouteContext): Promise<Response> {
  const session = await requireSession();

  if (!canAccessModule(session.role, "reports", "read")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await context.params;
  const report = await getReportById(session, id);

  if (!report || !canExportReport(session, report)) {
    notFound();
  }

  const [metrics, relatedRisks, relatedIncidents, branding] = await Promise.all([
    getClientReportMetrics(session, report.client_id),
    getRelatedOpenRisks(session, report.client_id),
    getRelatedOpenIncidents(session, report.client_id),
    getOrganizationBranding(session),
  ]);

  const generatedAt = new Date();
  const pdf = await generateReportPdf({
    branding,
    report,
    metrics,
    relatedRisks,
    relatedIncidents,
    generatedAt,
  });

  const filename = buildReportExportFilename(
    report.clients?.name ?? "client",
    report.reporting_period_end,
  );

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: report.id,
    action: "report_pdf_exported",
    title: `Report exported: ${report.title}`,
    metadata: { reportId: report.id, clientId: report.client_id, filename },
  });

  await dispatchAutomation({
    trigger: "report_exported",
    organizationId: session.organization.id,
    entityType: "report",
    entityId: report.id,
    clientId: report.client_id,
    actorUserId: session.user.id,
    payload: {
      title: report.title,
      clientId: report.client_id,
      reportId: report.id,
      filename,
    },
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

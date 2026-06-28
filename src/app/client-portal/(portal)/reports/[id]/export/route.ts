import { notFound } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity/record";
import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";
import {
  getPortalRelatedOpenIncidents,
  getPortalRelatedOpenRisks,
  getPortalReportById,
  getPortalReportMetrics,
} from "@/lib/client-portal/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";
import {
  buildReportExportFilename,
  generateReportPdf,
} from "@/lib/reports/pdf";
import type { ReportWithRelations } from "@/lib/reports/types";

type PortalExportRouteContext = {
  params: Promise<{ id: string }>;
};

/** Portal PDF download for a sent report. */
export async function GET(_request: Request, context: PortalExportRouteContext): Promise<Response> {
  const session = await requireClientPortalSession();
  const { id } = await context.params;
  const report = await getPortalReportById(session, id);

  if (!report) {
    notFound();
  }

  const reportForPdf = {
    ...report,
    organization_id: session.client.organization_id,
    client_id: session.client.id,
    assigned_user_id: "",
    created_at: "",
    updated_at: "",
    clients: { name: session.client.name, contact_email: null },
    users: null,
  } as ReportWithRelations;

  const [metrics, relatedRisks, relatedIncidents, branding] = await Promise.all([
    getPortalReportMetrics(session),
    getPortalRelatedOpenRisks(session),
    getPortalRelatedOpenIncidents(session),
    getOrganizationBrandingForOrganization(session.organization.id, session.organization.name),
  ]);

  const generatedAt = new Date();
  const pdf = await generateReportPdf({
    branding,
    report: reportForPdf,
    metrics,
    relatedRisks,
    relatedIncidents,
    generatedAt,
  });

  const filename = buildReportExportFilename(session.client.name, report.reporting_period_end);

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: null,
    entityType: "report",
    entityId: report.id,
    action: "portal_report_downloaded",
    title: `Report downloaded via portal: ${report.title}`,
    description: session.portalUser.email,
    metadata: {
      reportId: report.id,
      clientId: session.client.id,
      portalUserId: session.portalUser.id,
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

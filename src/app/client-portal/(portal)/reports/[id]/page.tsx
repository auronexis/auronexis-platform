import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalActionLink, PortalCard } from "@/components/client-portal/portal-ui";
import { ExecutiveMetrics } from "@/components/executive-reports/executive-metrics";
import { ExecutiveSummaryCard } from "@/components/executive-reports/executive-summary-card";
import { getPortalReportById } from "@/lib/client-portal/queries";
import { getPortalExecutiveReport } from "@/lib/executive-reports/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";
import { formatReportDate, formatReportPeriod } from "@/lib/reports/types";

type PortalReportDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PortalReportDetailPageProps): Promise<Metadata> {
  const session = await requireClientPortalSession();
  const { id } = await params;
  const report = await getPortalReportById(session, id);

  return {
    title: report?.title ?? "Report",
  };
}

export default async function ClientPortalReportDetailPage({ params }: PortalReportDetailPageProps) {
  const session = await requireClientPortalSession();
  const { id } = await params;
  const report = await getPortalReportById(session, id);

  if (!report) {
    notFound();
  }

  const executiveSnapshot = await getPortalExecutiveReport(
    session.organization.id,
    session.client.id,
    report.id,
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <Link
            href="/client-portal/reports"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to Report Center
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {report.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span>
              {formatReportPeriod(report.reporting_period_start, report.reporting_period_end)}
            </span>
            <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Published
            </span>
            {report.version ? <span>Version {report.version}</span> : null}
            {report.published_at ? (
              <span>Published {formatReportDate(report.published_at)}</span>
            ) : report.sent_at ? (
              <span>Shared {formatReportDate(report.sent_at)}</span>
            ) : null}
          </div>
        </div>
        <PortalActionLink href={`/client-portal/reports/${report.id}/export`}>
          Download PDF
        </PortalActionLink>
      </div>

      {(report.summary || report.health_score != null || report.sla_score != null) && (
        <PortalCard className="mb-6">
          <dl className="grid gap-6 sm:grid-cols-3">
            {report.summary ? (
              <div className="sm:col-span-3">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Summary
                </dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {report.summary}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Health score
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">
                {report.health_score ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                SLA compliance
              </dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">
                {report.sla_score != null ? `${report.sla_score}%` : "—"}
              </dd>
            </div>
          </dl>
        </PortalCard>
      )}

      <PortalCard>
        <dl className="space-y-8">
          {[
            ["Executive summary", report.executive_summary],
            ["Key wins", report.key_wins],
            ["Key risks", report.key_risks],
            ["Next actions", report.next_actions],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                {label}
              </dt>
              <dd className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {value ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      </PortalCard>

      {executiveSnapshot ? (
        <PortalCard className="mt-6">
          <h2 className="text-lg font-semibold text-foreground">Executive overview</h2>
          <p className="mt-1 text-sm text-muted">Leadership summary for this published report.</p>
          <div className="mt-6 space-y-6">
            <ExecutiveSummaryCard summary={executiveSnapshot.executive_summary} />
            <ExecutiveMetrics
              riskSummary={executiveSnapshot.risk_summary}
              incidentSummary={executiveSnapshot.incident_summary}
              slaSummary={executiveSnapshot.sla_summary}
              monitoringSummary={executiveSnapshot.monitoring_summary}
              aiSummary={executiveSnapshot.ai_summary}
            />
          </div>
        </PortalCard>
      ) : null}
    </>
  );
}

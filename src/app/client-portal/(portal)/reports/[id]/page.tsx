import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalActionLink, PortalCard, PortalSentBadge } from "@/components/client-portal/portal-ui";
import { getPortalReportById } from "@/lib/client-portal/queries";
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
            <PortalSentBadge />
            {report.sent_at ? <span>Generated {formatReportDate(report.sent_at)}</span> : null}
          </div>
        </div>
        <PortalActionLink href={`/client-portal/reports/${report.id}/export`}>
          Download PDF
        </PortalActionLink>
      </div>

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
    </>
  );
}

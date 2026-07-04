import type { Metadata } from "next";
import Link from "next/link";
import { Activity, FileText, LifeBuoy, Timer } from "lucide-react";
import {
  PortalContactsCard,
  PortalExecutiveSummary,
  PortalMetricCard,
  PortalOverviewHero,
  PortalReportCard,
  PortalSlaSummaryCard,
  PortalSupportCard,
  PortalTimeline,
} from "@/components/client-portal/portal-v3";
import { PortalIncidentCard } from "@/components/client-portal/portal-v3/portal-incident-card";
import { PortalCard, PortalKpiMetric, PortalQuickAccessCard } from "@/components/client-portal/portal-ui";
import { ClientHealthBadge } from "@/components/health/client-health-badge";
import { recordPortalActivity } from "@/lib/client-portal/activity";
import { getPortalOverview } from "@/lib/client-portal/portal-queries";
import { getPortalSupport } from "@/lib/client-portal/portal-support";
import { requireClientPortalSession } from "@/lib/client-portal/session";
import { getOrganizationBrandingForOrganization } from "@/lib/branding/queries";
import { HEALTH_STATUS_LABELS } from "@/lib/health/types";
import { formatReportDate, formatReportPeriod } from "@/lib/reports/types";
import { formatSlaHours } from "@/lib/sla/calculations";
import { linkText } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Portal Overview",
};

export default async function ClientPortalOverviewPage() {
  const session = await requireClientPortalSession();
  const branding = await getOrganizationBrandingForOrganization(
    session.organization.id,
    session.organization.name,
  );
  const [data, support] = await Promise.all([
    getPortalOverview(session, branding.supportEmail ?? null),
    getPortalSupport(session, branding.supportEmail ?? null),
  ]);

  void recordPortalActivity(session, {
    eventType: "portal.viewed",
    title: "Portal overview viewed",
    description: session.client.name,
  }).catch(() => undefined);

  const slaPolicy = data.slaSummary.assignment.effectivePolicy;
  const healthSummary = data.health
    ? {
        clientId: session.client.id,
        score: data.health.score,
        status: data.health.status,
        delta: data.health.delta,
        reason: data.health.reason,
        calculatedAt: data.health.calculated_at,
      }
    : null;

  return (
    <>
      <PortalOverviewHero clientName={data.clientName} branding={branding} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <PortalMetricCard
          label="Health"
          icon={Activity}
          tone="primary"
          href="/client-portal/health"
          subtext={data.health ? HEALTH_STATUS_LABELS[data.health.status] : "Health score pending"}
        >
          {healthSummary ? (
            <ClientHealthBadge summary={healthSummary} />
          ) : (
            <PortalKpiMetric>—</PortalKpiMetric>
          )}
        </PortalMetricCard>

        <PortalMetricCard
          label="Latest report"
          icon={FileText}
          tone="primary"
          href={
            data.latestReport
              ? `/client-portal/reports/${data.latestReport.id}`
              : "/client-portal/reports"
          }
          subtext={
            data.latestReport
              ? formatReportPeriod(
                  data.latestReport.reporting_period_start,
                  data.latestReport.reporting_period_end,
                )
              : "No reports shared yet"
          }
        >
          {data.latestReport ? (
            <p className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
              {data.latestReport.title}
            </p>
          ) : (
            <p className="text-sm font-medium text-muted">No reports available yet.</p>
          )}
        </PortalMetricCard>

        <PortalMetricCard
          label="SLA status"
          icon={Timer}
          tone="neutral"
          href="/client-portal/sla"
          subtext={slaPolicy ? slaPolicy.name : "No SLA policy assigned yet."}
        >
          <PortalKpiMetric>
            {slaPolicy ? formatSlaHours(slaPolicy.incident_hours) : "—"}
          </PortalKpiMetric>
        </PortalMetricCard>

        <PortalMetricCard
          label="Open incidents"
          icon={LifeBuoy}
          tone="neutral"
          href="/client-portal/incidents"
          subtext={
            data.openIncidentsCount > 0
              ? `${data.openIncidentsCount} shared with your portal`
              : "No portal-visible incidents"
          }
        >
          <PortalKpiMetric>{data.openIncidentsCount}</PortalKpiMetric>
        </PortalMetricCard>
      </div>

      <section className="mt-10 space-y-6">
        <PortalExecutiveSummary snapshot={data.executiveOverview} />
        {data.latestReport ? <PortalReportCard report={data.latestReport} /> : null}
        <PortalSlaSummaryCard summary={data.slaSummary} />
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <PortalCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
              <p className="mt-1 text-sm text-muted">Client-safe updates from your agency.</p>
            </div>
            <Link href="/client-portal/timeline" className={linkText}>
              View all
            </Link>
          </div>
          <div className="mt-5">
            <PortalTimeline events={data.recentEvents} />
          </div>
        </PortalCard>

        <div className="space-y-6">
          <PortalContactsCard contacts={data.contacts} />
          <PortalSupportCard support={support} />
        </div>
      </section>

      {data.openIncidents.length > 0 ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Shared incidents</h2>
          {data.openIncidents.slice(0, 3).map((incident) => (
            <PortalIncidentCard key={incident.id} incident={incident} />
          ))}
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          Quick access
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PortalQuickAccessCard
            href="/client-portal/executive"
            icon={FileText}
            tone="primary"
            title="Executive"
            description="Review leadership summaries from published reports."
          />
          <PortalQuickAccessCard
            href="/client-portal/health"
            icon={Activity}
            tone="primary"
            title="Health"
            description="Review your operational health score and trend."
          />
          <PortalQuickAccessCard
            href="/client-portal/support"
            icon={LifeBuoy}
            tone="primary"
            title="Support"
            description="Contact your agency team for help and operational questions."
          />
        </div>
      </section>

      {data.latestReport ? (
        <p className="mt-6 text-sm text-muted">
          Last report update: {formatReportDate(data.latestReport.updated_at ?? data.latestReport.sent_at)}
        </p>
      ) : null}
    </>
  );
}

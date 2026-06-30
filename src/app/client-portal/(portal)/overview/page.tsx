import type { Metadata } from "next";
import Link from "next/link";
import { Activity, FileText, LifeBuoy, Timer } from "lucide-react";
import { ClientHealthBadge } from "@/components/health/client-health-badge";
import { PortalTimelineList } from "@/components/client-portal/portal-timeline-list";
import {
  PortalCard,
  PortalHero,
  PortalKpiCard,
  PortalKpiMetric,
  PortalQuickAccessCard,
} from "@/components/client-portal/portal-ui";
import { recordPortalActivity } from "@/lib/client-portal/activity";
import { getPortalOverviewData } from "@/lib/client-portal/queries";
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
  const data = await getPortalOverviewData(session, branding.supportEmail ?? null);

  void recordPortalActivity(session, {
    eventType: "portal.viewed",
    title: "Portal overview viewed",
    description: session.client.name,
  }).catch(() => undefined);

  const slaPolicy = data.slaAssignment.effectivePolicy;
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
      <PortalHero clientName={data.clientName} branding={branding} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <PortalKpiCard
          label="Health"
          icon={Activity}
          tone="primary"
          href="/client-portal/health"
          subtext={
            data.health
              ? HEALTH_STATUS_LABELS[data.health.status]
              : "Health score pending"
          }
        >
          {healthSummary ? (
            <ClientHealthBadge summary={healthSummary} />
          ) : (
            <PortalKpiMetric>—</PortalKpiMetric>
          )}
        </PortalKpiCard>

        <PortalKpiCard
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
        </PortalKpiCard>

        <PortalKpiCard
          label="SLA status"
          icon={Timer}
          tone="neutral"
          href="/client-portal/sla"
          subtext={slaPolicy ? slaPolicy.name : "No SLA policy assigned yet."}
        >
          <PortalKpiMetric>
            {slaPolicy ? formatSlaHours(slaPolicy.incident_hours) : "—"}
          </PortalKpiMetric>
        </PortalKpiCard>

        <PortalKpiCard
          label="Main contact"
          icon={LifeBuoy}
          tone="neutral"
          href="/client-portal/contacts"
          subtext={data.contacts.accountOwnerName ?? "Contact details available"}
        >
          <PortalKpiMetric className="text-base">
            {data.contacts.contactName ?? data.contacts.accountOwnerName ?? "—"}
          </PortalKpiMetric>
        </PortalKpiCard>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <PortalCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent activity</h2>
              <p className="mt-1 text-sm text-muted">
                Latest updates shared with your organization.
              </p>
            </div>
            <Link href="/client-portal/timeline" className={linkText}>
              View all
            </Link>
          </div>
          <div className="mt-5">
            <PortalTimelineList events={data.recentEvents} />
          </div>
        </PortalCard>

        <PortalCard>
          <h2 className="text-lg font-semibold text-foreground">Support</h2>
          <p className="mt-1 text-sm text-muted">
            Need help? Support requests are coming soon.
          </p>
          <div className="mt-5 space-y-4">
            <p className="text-sm text-muted">
              {data.contacts.supportEmail
                ? `For urgent matters, email ${data.contacts.supportEmail}.`
                : "Your agency team will enable support requests in a future update."}
            </p>
            <Link
              href="/client-portal/support"
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Go to support
            </Link>
          </div>
        </PortalCard>
      </section>

      <section className="mt-10">
        <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          Quick access
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PortalQuickAccessCard
            href="/client-portal/health"
            icon={Activity}
            tone="primary"
            title="Health"
            description="Review your operational health score and trend."
          />
          <PortalQuickAccessCard
            href="/client-portal/reports"
            icon={FileText}
            tone="primary"
            title="Reports"
            description="View reports shared by your agency."
          />
          <PortalQuickAccessCard
            href="/client-portal/support"
            icon={LifeBuoy}
            tone="primary"
            title="Support"
            description="Support requests are coming soon."
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

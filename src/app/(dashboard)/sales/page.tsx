import type { Metadata } from "next";
import Link from "next/link";
import { ContactInboxWidget } from "@/components/sales/contact-inbox-widget";
import { PipelineMetricCards } from "@/components/sales/pipeline-metric-cards";
import { RecentOutreachList } from "@/components/sales/recent-outreach-list";
import { SalesLeadTable } from "@/components/sales/sales-lead-table";
import { PageHeader } from "@/components/layout/page-header";
import { listSalesAssets } from "@/lib/sales/assets";
import { getBookingLinks } from "@/lib/sales/calendar";
import { computeRevenueMetrics } from "@/lib/sales/metrics";
import { FOUNDING_CUSTOMER_OFFER } from "@/lib/sales/founding-program";
import {
  getPipelineDashboardMetrics,
  listRecentOutreach,
  listSalesLeads,
} from "@/lib/sales/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Sales Pipeline",
};

export default async function SalesDashboardPage() {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const [metrics, leads, outreach, booking] = await Promise.all([
    getPipelineDashboardMetrics(session),
    listSalesLeads(session, { limit: 10 }),
    listRecentOutreach(session),
    Promise.resolve(getBookingLinks()),
  ]);
  const revenueMetrics = computeRevenueMetrics(leads);
  const assets = listSalesAssets();

  return (
    <>
      <PageHeader
        module="sales"
        title="Sales pipeline"
        description="Acquire founding customers — leads, pilots, discovery calls, and revenue metrics."
        action={
          <Link href="/sales/leads" className="text-sm font-medium text-primary hover:underline">
            View all leads
          </Link>
        }
      />

      <PipelineMetricCards metrics={metrics} />

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <ContactInboxWidget metrics={metrics} />
        <section className="aurora-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Revenue metrics</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs uppercase tracking-wider text-muted">MRR</dt><dd className="text-lg font-semibold">${revenueMetrics.mrr.toLocaleString()}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-muted">ARR</dt><dd className="text-lg font-semibold">${revenueMetrics.arr.toLocaleString()}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-muted">Lead velocity (30d)</dt><dd className="text-lg font-semibold">{revenueMetrics.leadVelocity}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-muted">Pipeline value</dt><dd className="text-lg font-semibold">${revenueMetrics.pipelineValue.toLocaleString()}</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-muted">Conversion</dt><dd className="text-lg font-semibold">{revenueMetrics.conversionRate}%</dd></div>
            <div><dt className="text-xs uppercase tracking-wider text-muted">CAC</dt><dd className="text-lg font-semibold">{revenueMetrics.cac ? `$${revenueMetrics.cac.toLocaleString()}` : "—"}</dd></div>
          </dl>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="aurora-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Founding program</h2>
          <p className="mt-1 text-sm text-muted">{FOUNDING_CUSTOMER_OFFER.summary}</p>
          <p className="mt-4 text-2xl font-semibold">
            {metrics.foundingProgram.enrolled}/{metrics.foundingProgram.limit} slots filled
          </p>
          <ul className="mt-4 space-y-1 text-sm text-muted">
            {FOUNDING_CUSTOMER_OFFER.benefits.map((benefit) => (
              <li key={benefit}>• {benefit}</li>
            ))}
          </ul>
        </section>
        <section className="aurora-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Discovery scheduling</h2>
          <p className="mt-1 text-sm text-muted">Calendly, Google Calendar, and Meet links for sales calls.</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="text-muted">Calendly: {booking.calendlyDiscoveryUrl ? <a className="text-primary hover:underline" href={booking.calendlyDiscoveryUrl} target="_blank" rel="noreferrer">Configured</a> : "Not configured"}</li>
            <li className="text-muted">Google Calendar: {booking.googleCalendarUrl ? <a className="text-primary hover:underline" href={booking.googleCalendarUrl} target="_blank" rel="noreferrer">Configured</a> : "Not configured"}</li>
            <li className="text-muted">Google Meet base: {booking.googleMeetBaseUrl ?? "Not configured"}</li>
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="aurora-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Sales assets</h2>
          <ul className="mt-4 space-y-3">
            {assets.map((asset) => (
              <li key={asset.key} className="rounded-xl border border-border-subtle px-4 py-3">
                <p className="font-medium text-foreground">{asset.title}</p>
                <p className="text-sm text-muted">{asset.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <RecentOutreachList activities={outreach} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-foreground">Recent leads</h2>
        <SalesLeadTable leads={leads} />
      </section>
    </>
  );
}

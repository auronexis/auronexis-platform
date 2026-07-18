import type { Metadata } from "next";
import { AcquisitionMetricCards } from "@/components/sales/acquisition-metric-cards";
import { AutomationSnapshotCard } from "@/components/sales/automation-snapshot-card";
import { PageHeader } from "@/components/layout/page-header";
import { runLeadAutomationScan } from "@/lib/sales/actions";
import { computeExtendedRevenueMetrics } from "@/lib/sales/acquisition-metrics";
import {
  getAcquisitionDashboard,
  getAutomationDashboard,
  listSalesLeads,
} from "@/lib/sales/queries";
import { requireSession } from "@/lib/auth/session";
import { getStoredOrganizationCurrency, formatWorkspaceMoney } from "@/lib/i18n";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canAccessModule } from "@/lib/rbac/permissions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Acquisition Dashboard",
};

export default async function AcquisitionDashboardPage() {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const currency = getStoredOrganizationCurrency(session.organization);
  const formatMoney = (amount: number) => formatWorkspaceMoney(amount, currency);
  const canManage = canAccessModule(session.role, "sales", "manage");

  const [metrics, automation, leads] = await Promise.all([
    getAcquisitionDashboard(session),
    getAutomationDashboard(session),
    listSalesLeads(session),
  ]);
  const revenue = computeExtendedRevenueMetrics(leads);

  return (
    <>
      <PageHeader
        module="sales"
        title="Acquisition dashboard"
        description="Outbound pipeline, forecasts, automation health, and revenue metrics for first customers."
        action={
          canManage ? (
            <form action={runLeadAutomationScan}>
              <Button type="submit" size="sm" variant="secondary">
                Run automation scan
              </Button>
            </form>
          ) : null
        }
      />

      <AcquisitionMetricCards metrics={metrics} />

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <AutomationSnapshotCard snapshot={automation} />
        <section className="aurora-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Revenue metrics</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="MRR growth (30d)" value={`${revenue.mrrGrowth}%`} />
            <Metric label="ARR growth (30d)" value={`${revenue.arrGrowth}%`} />
            <Metric label="Close rate" value={`${revenue.closeRate}%`} />
            <Metric label="Pilot conversion" value={`${revenue.pilotConversion}%`} />
            <Metric label="CAC" value={revenue.cac ? formatMoney(revenue.cac) : "—"} />
            <Metric
              label="Payback period"
              value={revenue.paybackPeriodMonths ? `${revenue.paybackPeriodMonths} mo` : "—"}
            />
            <Metric
              label="Sales cycle"
              value={revenue.salesCycleDays ? `${revenue.salesCycleDays} days` : "—"}
            />
            <Metric label="Won MRR" value={formatMoney(revenue.mrr)} />
          </dl>
        </section>
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-lg font-semibold text-foreground">{value}</dd>
    </div>
  );
}

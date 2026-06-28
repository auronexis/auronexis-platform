import type { Metadata } from "next";
import { SalesExecutionMetricCards } from "@/components/sales/sales-execution-metric-cards";
import { FirstCustomerMetricsCard } from "@/components/sales/first-customer-metrics-card";
import { PageHeader } from "@/components/layout/page-header";
import { getFirstCustomerMetricsDashboard, getSalesExecutionDashboard } from "@/lib/sales/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = { title: "Sales Execution" };

export default async function SalesExecutionPage() {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const [execution, metrics] = await Promise.all([
    getSalesExecutionDashboard(session),
    getFirstCustomerMetricsDashboard(session),
  ]);

  return (
    <>
      <PageHeader
        module="sales"
        title="Sales execution"
        description="Outreach, replies, meetings, pilots, won deals, and revenue for first customer conversion."
      />
      <SalesExecutionMetricCards metrics={execution} />
      <div className="mt-8">
        <FirstCustomerMetricsCard metrics={metrics} />
      </div>
    </>
  );
}

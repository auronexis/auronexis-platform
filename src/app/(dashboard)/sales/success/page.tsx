import type { Metadata } from "next";
import { CustomerSuccessTable } from "@/components/sales/customer-success-table";
import { PageHeader } from "@/components/layout/page-header";
import { listCustomerSuccessRecords } from "@/lib/sales/queries";
import { summarizeCustomerSuccess, PILOT_ONBOARDING_CHECKLIST } from "@/lib/sales/customer-success";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canAccessModule } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "Customer Success",
};

export default async function CustomerSuccessPage() {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const canManage = canAccessModule(session.role, "sales", "update");
  const records = await listCustomerSuccessRecords(session);
  const summary = summarizeCustomerSuccess(records);

  return (
    <>
      <PageHeader
        module="sales"
        title="Customer success"
        description="Pilot onboarding, adoption scores, renewal probability, and founding customer health."
      />

      {records.length > 0 ? (
        <section className="aurora-surface mb-8 p-5">
          <h2 className="text-base font-semibold text-foreground">Portfolio summary</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryMetric label="Customers" value={String(summary.count)} />
            <SummaryMetric label="Avg adoption" value={`${summary.avgAdoption}%`} />
            <SummaryMetric label="Avg usage" value={`${summary.avgUsage}%`} />
            <SummaryMetric label="Avg success" value={`${summary.avgSuccess}%`} />
            <SummaryMetric label="Avg risk" value={`${summary.avgRisk}%`} />
            <SummaryMetric label="Avg renewal" value={`${summary.avgRenewal}%`} />
          </dl>
        </section>
      ) : null}

      <section className="aurora-surface mb-8 p-5">
        <h2 className="text-base font-semibold text-foreground">Pilot onboarding checklist</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PILOT_ONBOARDING_CHECKLIST.map((item, index) => (
            <li key={item} className="flex items-center gap-2 text-sm text-muted">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle text-xs font-medium text-foreground">
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <CustomerSuccessTable records={records} canManage={canManage} />
    </>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-lg font-semibold text-foreground">{value}</dd>
    </div>
  );
}

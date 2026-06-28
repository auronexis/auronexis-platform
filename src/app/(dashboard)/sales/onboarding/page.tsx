import type { Metadata } from "next";
import { CustomerOnboardingTable } from "@/components/sales/customer-onboarding-table";
import { PageHeader } from "@/components/layout/page-header";
import { listCustomerOnboardingRecords } from "@/lib/sales/queries";
import { KICKOFF_WORKFLOW_STEPS, CUSTOMER_ONBOARDING_CHECKLIST } from "@/lib/sales/customer-onboarding";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canAccessModule } from "@/lib/rbac/permissions";

export const metadata: Metadata = { title: "Customer Onboarding" };

export default async function CustomerOnboardingPage() {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const canManage = canAccessModule(session.role, "sales", "update");
  const records = await listCustomerOnboardingRecords(session);

  return (
    <>
      <PageHeader
        module="sales"
        title="Customer onboarding"
        description="Kickoff workflow, workspace setup, integrations, diagnostics baseline, and health score."
      />
      <section className="aurora-surface mb-8 p-5">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-base font-semibold text-foreground">Kickoff workflow</h2>
            <ul className="mt-3 space-y-2">
              {KICKOFF_WORKFLOW_STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-2 text-sm text-muted">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle text-xs font-medium">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Delivery checklist</h2>
            <ul className="mt-3 space-y-2">
              {CUSTOMER_ONBOARDING_CHECKLIST.map((step, i) => (
                <li key={step} className="flex items-center gap-2 text-sm text-muted">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle text-xs font-medium">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <CustomerOnboardingTable records={records} canManage={canManage} />
    </>
  );
}

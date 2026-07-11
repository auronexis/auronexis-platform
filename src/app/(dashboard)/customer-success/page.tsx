import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { buildCustomerSuccessPortfolio } from "@/lib/customer-success/snapshot";
import { CustomerSuccessHub } from "@/components/customer-success/customer-success-hub";
import { CustomerSuccessTracker } from "@/components/customer-success/customer-success-tracker";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";

export const metadata: Metadata = {
  title: "Customer Success",
};

export default async function CustomerSuccessPage() {
  await requireModuleAccess("customer_success");
  const session = await requireSession();

  if (!sessionHasPermission(session, "customer_success.read")) {
    return (
      <PageSurface>
        <p className="text-sm text-muted">You do not have permission to view customer success operations.</p>
      </PageSurface>
    );
  }

  const planContext = await getOrganizationPlanContextForSession(session).catch(() => null);
  const portfolio = await buildCustomerSuccessPortfolio({ session, planContext });

  return (
    <>
      <PageHeader
        title="Customer Success"
        description="Portfolio health, playbooks, tasks, and recovery tracking."
      />
      <CustomerSuccessTracker
        event="customer_success_page_viewed"
        organizationId={session.organization.id}
      />
      <PageSurface>
        <CustomerSuccessHub portfolio={portfolio} />
      </PageSurface>
    </>
  );
}

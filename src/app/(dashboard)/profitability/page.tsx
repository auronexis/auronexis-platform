import type { Metadata } from "next";
import { ProfitabilityOverview } from "@/components/profitability/profitability-overview";
import { ProfitabilityTable } from "@/components/profitability/profitability-table";
import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { getStoredOrganizationCurrency } from "@/lib/i18n";
import { canEditClientFinancials } from "@/lib/profitability/guards";
import { getProfitabilityOverview } from "@/lib/profitability/queries";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Profitability",
};

export default async function ProfitabilityPage() {
  await requireModuleAccess("profitability");
  const session = await requireSession();
  const { summary, rows, topClients, mostProfitableClients, needsAttention } =
    await getProfitabilityOverview(session);
  const currency = getStoredOrganizationCurrency(session.organization);

  return (
    <PlanFeatureGate feature="profitability">
      <PageHeader
        module="profitability"
        title="Profitability"
        description="Financial intelligence and margin visibility across your client portfolio."
      />

      <ProfitabilityOverview
        summary={summary}
        topClients={topClients}
        mostProfitableClients={mostProfitableClients}
        needsAttention={needsAttention}
        currency={currency}
      />

      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-muted">
          Client profitability
        </h2>
        <ProfitabilityTable rows={rows} canEdit={canEditClientFinancials(session)} />
      </div>
    </PlanFeatureGate>
  );
}

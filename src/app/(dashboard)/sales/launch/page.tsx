import type { Metadata } from "next";
import { LaunchExecutionTargetsCard } from "@/components/sales/launch-execution-targets-card";
import { Top100AgenciesCard } from "@/components/sales/top100-agencies-card";
import { PageHeader } from "@/components/layout/page-header";
import { getLaunchExecutionDashboard } from "@/lib/sales/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = { title: "Launch Execution" };

export default async function SalesLaunchPage() {
  await requireModuleAccess("sales");
  const session = await requireSession();
  const dashboard = await getLaunchExecutionDashboard(session);

  return (
    <>
      <PageHeader
        module="sales"
        title="Launch execution"
        description="Phase 8 Sprint 0 — production launch targets, Top 100 agency population, and customer acquisition execution."
      />
      <LaunchExecutionTargetsCard dashboard={dashboard} />
      <div className="mt-8">
        <Top100AgenciesCard dashboard={dashboard} />
      </div>
    </>
  );
}

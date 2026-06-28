import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type ReportSchedulesLayoutProps = {
  children: React.ReactNode;
};

export default async function ReportSchedulesLayout({ children }: ReportSchedulesLayoutProps) {
  await requireModuleAccess("reports");

  return <PlanFeatureGate feature="report_scheduling">{children}</PlanFeatureGate>;
}

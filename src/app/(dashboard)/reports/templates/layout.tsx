import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type ReportTemplatesLayoutProps = {
  children: React.ReactNode;
};

export default async function ReportTemplatesLayout({ children }: ReportTemplatesLayoutProps) {
  await requireModuleAccess("reports");

  return <PlanFeatureGate feature="report_templates">{children}</PlanFeatureGate>;
}

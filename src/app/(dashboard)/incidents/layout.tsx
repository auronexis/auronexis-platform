import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type IncidentsLayoutProps = {
  children: React.ReactNode;
};

export default async function IncidentsLayout({ children }: IncidentsLayoutProps) {
  await requireModuleAccess("incidents");

  return <PlanFeatureGate feature="incidents">{children}</PlanFeatureGate>;
}

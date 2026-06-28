import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type RisksLayoutProps = {
  children: React.ReactNode;
};

export default async function RisksLayout({ children }: RisksLayoutProps) {
  await requireModuleAccess("risks");

  return <PlanFeatureGate feature="risks">{children}</PlanFeatureGate>;
}

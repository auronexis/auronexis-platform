import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type SlaSettingsLayoutProps = {
  children: React.ReactNode;
};

export default async function SlaSettingsLayout({ children }: SlaSettingsLayoutProps) {
  await requireModuleAccess("settings");

  return <PlanFeatureGate feature="sla_tracking">{children}</PlanFeatureGate>;
}

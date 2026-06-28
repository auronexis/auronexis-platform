import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type EscalationSettingsLayoutProps = {
  children: React.ReactNode;
};

export default async function EscalationSettingsLayout({ children }: EscalationSettingsLayoutProps) {
  await requireModuleAccess("settings");

  return <PlanFeatureGate feature="escalation_rules">{children}</PlanFeatureGate>;
}

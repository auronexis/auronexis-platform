import type { Metadata } from "next";
import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Automation",
};

export default async function AutomationLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess("workflows");

  return <PlanFeatureGate feature="ai_automation_builder">{children}</PlanFeatureGate>;
}

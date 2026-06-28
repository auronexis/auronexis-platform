import { DashboardUpgradeFeatureCard } from "@/components/dashboard/dashboard-upgrade-cards";

export function DashboardBusinessUpgradeCard() {
  return (
    <DashboardUpgradeFeatureCard
      title="Unlock Risk Monitoring"
      message="Risks, incidents, SLA tracking, and escalation rules are available on the Business plan."
      requiredPlanLabel="Business"
    />
  );
}

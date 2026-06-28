import { requireSession } from "@/lib/auth/session";
import { checkPlanFeatureForSession } from "@/lib/plans/guards";
import type { PlanFeatureKey } from "@/lib/plans/types";
import { UpgradeRequiredPanel } from "@/components/plans/upgrade-required-panel";

type PlanFeatureGateProps = {
  feature: PlanFeatureKey;
  children: React.ReactNode;
};

/** Server component gate — shows upgrade prompt when the org plan lacks a feature. */
export async function PlanFeatureGate({ feature, children }: PlanFeatureGateProps) {
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, feature);

  if (!access.allowed) {
    return (
      <UpgradeRequiredPanel
        message={access.message}
        requiredPlanLabel={access.requiredPlanLabel}
      />
    );
  }

  return children;
}

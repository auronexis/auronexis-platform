import { ClientSuccessPanel } from "@/components/clients/success/client-success-panel";
import { AIUpgradeCard } from "@/components/ai/ai-usage-card";
import { DetailSection } from "@/components/layout/detail-page";
import { getClientSuccessAnalysis } from "@/lib/ai/client-success/get-analysis";
import { INSUFFICIENT_CLIENT_DATA } from "@/lib/ai/client-success/types";
import { requireSession } from "@/lib/auth/session";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";

type ClientSuccessSectionProps = {
  clientId: string;
};

export async function ClientSuccessSection({ clientId }: ClientSuccessSectionProps) {
  const session = await requireSession();
  const aiAccess = await checkPlanFeatureForSession(session, "ai_client_success");
  const analysis = aiAccess.allowed ? await getClientSuccessAnalysis(session, clientId) : null;

  return (
    <DetailSection
      title="Client Success Intelligence"
      description="AI-powered health, churn risk, communication, and operational maturity analysis."
    >
      {!aiAccess.allowed ? (
        <AIUpgradeCard
          message={getFeatureUpgradeMessage("ai_client_success")}
          requiredPlanLabel={getRequiredPlanLabel("ai_client_success")}
          title="Client Success Intelligence"
        />
      ) : !analysis ? (
        <p className="text-sm text-muted">{INSUFFICIENT_CLIENT_DATA}</p>
      ) : (
        <ClientSuccessPanel initialAnalysis={analysis} />
      )}
    </DetailSection>
  );
}

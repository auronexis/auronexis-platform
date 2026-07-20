import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { ClientsSuccessWorkspace } from "@/components/clients/success/clients-success-workspace";
import { AIUpgradeCard } from "@/components/ai/ai-usage-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { getClientSuccessPortfolio } from "@/lib/ai/client-success/get-analysis";
import { requireSession } from "@/lib/auth/session";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Client Success",
};

export default async function ClientsSuccessPage() {
  await requireModuleAccess("clients");
  const session = await requireSession();
  const aiAccess = await checkPlanFeatureForSession(session, "ai_client_analysis");

  return (
    <>
      <PageHeader
        title="Client Success"
        description="Prioritize accounts by health, churn risk, and operational signals."
      />

      <PageSurface>
        {!aiAccess.allowed ? (
          <AIUpgradeCard
            message={getFeatureUpgradeMessage("ai_client_analysis")}
            requiredPlanLabel={getRequiredPlanLabel("ai_client_analysis")}
            title="Client Success Intelligence"
          />
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2 text-sm text-muted">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Rankings use verified reports, risks, incidents, SLA, profitability, and activity.</span>
            </div>
            <ClientsSuccessWorkspace initialData={await getClientSuccessPortfolio(session)} />
          </>
        )}
      </PageSurface>
    </>
  );
}

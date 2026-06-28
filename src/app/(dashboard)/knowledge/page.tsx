import type { Metadata } from "next";
import { KnowledgeHubWorkspace } from "@/components/knowledge/knowledge-hub-workspace";
import { KnowledgeUpgradeCard } from "@/components/knowledge/knowledge-upgrade-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { getKnowledgeHubData } from "@/lib/ai/knowledge/get-hub";
import { requireSession } from "@/lib/auth/session";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";

export const metadata: Metadata = {
  title: "Knowledge Hub",
};

export default async function KnowledgePage() {
  const session = await requireSession();
  const [searchAccess, generationAccess, playbookAccess] = await Promise.all([
    checkPlanFeatureForSession(session, "ai_knowledge_search"),
    checkPlanFeatureForSession(session, "ai_knowledge_generation"),
    checkPlanFeatureForSession(session, "ai_playbook_generation"),
  ]);
  const hub = searchAccess.allowed ? await getKnowledgeHubData(session) : null;

  return (
    <>
      <PageHeader
        module="knowledge"
        title="Knowledge Hub"
        description="Organizational memory from verified reports, resolved risks and incidents, playbooks, and recommendations."
      />

      <PageSurface>
        {!searchAccess.allowed ? (
          <KnowledgeUpgradeCard
            message={getFeatureUpgradeMessage("ai_knowledge_search")}
            requiredPlanLabel={getRequiredPlanLabel("ai_knowledge_search")}
          />
        ) : hub ? (
          <KnowledgeHubWorkspace
            initialData={hub}
            canGenerate={generationAccess.allowed}
            canGeneratePlaybooks={playbookAccess.allowed}
          />
        ) : null}
      </PageSurface>
    </>
  );
}

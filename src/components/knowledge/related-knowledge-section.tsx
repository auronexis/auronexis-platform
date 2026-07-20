import { RelatedKnowledgePanelView } from "@/components/knowledge/related-knowledge-panel";
import { AIUpgradeCard } from "@/components/ai/ai-usage-card";
import { DetailSection } from "@/components/layout/detail-page";
import { buildRelatedKnowledgePanel } from "@/lib/ai/knowledge/get-hub";
import { requireSession } from "@/lib/auth/session";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";

type RelatedKnowledgeSectionProps = {
  clientId: string;
  title: string;
  text: string;
  entityType?: "risk" | "incident" | "report";
  entityId?: string;
};

export async function RelatedKnowledgeSection({
  clientId,
  title,
  text,
  entityType,
  entityId,
}: RelatedKnowledgeSectionProps) {
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, "ai_knowledge_search");
  const panel = access.allowed
    ? await buildRelatedKnowledgePanel(session, {
        clientId,
        title,
        text,
        entityType,
        entityId,
      })
    : null;

  return (
    <DetailSection
      title="Related knowledge"
      description="Verified historical reports, risks, incidents, and resolutions."
    >
      {!access.allowed ? (
        <AIUpgradeCard
          message={getFeatureUpgradeMessage("ai_knowledge_search")}
          requiredPlanLabel={getRequiredPlanLabel("ai_knowledge_search")}
          title="AI Knowledge Hub"
        />
      ) : panel ? (
        <RelatedKnowledgePanelView data={panel} />
      ) : null}
    </DetailSection>
  );
}

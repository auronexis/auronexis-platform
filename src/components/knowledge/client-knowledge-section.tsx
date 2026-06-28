import Link from "next/link";
import { RelatedKnowledgePanelView } from "@/components/knowledge/related-knowledge-panel";
import { KnowledgeHealthCard } from "@/components/knowledge/knowledge-health-card";
import { ReportAIUpgradeCard } from "@/components/reports/ai/report-ai-usage-card";
import { DetailSection } from "@/components/layout/detail-page";
import {
  buildRelatedKnowledgePanel,
  getClientKnowledgeTimeline,
  getKnowledgeHubData,
} from "@/lib/ai/knowledge/get-hub";
import { requireSession } from "@/lib/auth/session";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type ClientKnowledgeSectionProps = {
  clientId: string;
  clientName: string;
};

export async function ClientKnowledgeSection({ clientId, clientName }: ClientKnowledgeSectionProps) {
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, "ai_knowledge_search");

  if (!access.allowed) {
    return (
      <DetailSection
        title="Historical knowledge"
        description="Organizational memory for this client — reports, incidents, risks, and playbooks."
      >
        <ReportAIUpgradeCard
          message={getFeatureUpgradeMessage("ai_knowledge_search")}
          requiredPlanLabel={getRequiredPlanLabel("ai_knowledge_search")}
          title="AI Knowledge Hub"
        />
      </DetailSection>
    );
  }

  const [hub, timeline, related] = await Promise.all([
    getKnowledgeHubData(session),
    getClientKnowledgeTimeline(session, clientId),
    buildRelatedKnowledgePanel(session, {
      clientId,
      title: clientName,
      text: clientName,
    }),
  ]);

  const clientReports = hub.publishedReports.filter((item) => item.clientId === clientId);
  const clientRisks = hub.resolvedRisks.filter((item) => item.clientId === clientId);
  const clientIncidents = hub.resolvedIncidents.filter((item) => item.clientId === clientId);
  const clientPlaybooks = hub.playbooks.filter((playbook) =>
    playbook.relatedEntities.some((entity) => entity.clientId === clientId),
  );

  return (
    <DetailSection
      title="Historical knowledge"
      description="Previous reports, incidents, risks, lessons learned, and playbooks for this client."
      action={
        <Link href="/knowledge" className={cn(linkText, "text-sm")}>
          Open Knowledge Hub
        </Link>
      }
    >
      <div className="space-y-8">
        <KnowledgeHealthCard health={hub.health} recommendations={hub.recommendations} />

        <RelatedKnowledgePanelView data={related} />

        {timeline.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-foreground">Knowledge timeline</h3>
            <ol className="mt-4 space-y-4 border-l border-border pl-4" aria-label="Client knowledge timeline">
              {timeline.map((event) => (
                <li key={event.id} className="relative">
                  <span
                    className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary"
                    aria-hidden
                  />
                  <time className="text-xs text-muted" dateTime={event.date}>
                    {new Date(event.date).toLocaleDateString()}
                  </time>
                  <Link href={event.href} className={cn(linkText, "mt-1 block text-sm font-medium")}>
                    {event.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">{event.summary}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-sm text-muted">No historical knowledge timeline entries for this client yet.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryList title="Previous reports" items={clientReports} empty="No published reports." />
          <SummaryList title="Previous incidents" items={clientIncidents} empty="No resolved incidents." />
          <SummaryList title="Previous risks" items={clientRisks} empty="No resolved risks." />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Playbooks</h3>
            {clientPlaybooks.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No playbooks linked to this client yet.</p>
            ) : (
              <ul className="mt-2 space-y-2" role="list">
                {clientPlaybooks.slice(0, 4).map((playbook) => (
                  <li key={playbook.id} className="text-sm text-foreground">
                    {playbook.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DetailSection>
  );
}

function SummaryList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ title: string; href: string; excerpt: string }>;
  empty: string;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-2" role="list">
          {items.slice(0, 4).map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={cn(linkText, "text-sm font-medium")}>
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

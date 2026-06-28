import "server-only";

import { cache } from "react";
import {
  buildArticlesFromHistory,
  buildPlaybooksFromHistory,
  fetchPublishedReports,
  fetchReportTemplates,
  fetchResolvedIncidents,
  fetchResolvedRisks,
} from "@/lib/ai/knowledge/sources";
import {
  buildKnowledgeRecommendations,
  calculateKnowledgeHealth,
} from "@/lib/ai/knowledge/health";
import type {
  KnowledgeHubData,
  KnowledgeTimelineEvent,
  RelatedKnowledgePanel,
} from "@/lib/ai/knowledge/types";
import { findSimilarIssues, searchOrganizationalKnowledge } from "@/lib/ai/knowledge/search";
import type { SessionContext } from "@/lib/tenancy/context";

export const getKnowledgeHubData = cache(
  async (session: SessionContext): Promise<KnowledgeHubData> => {
    const [reports, risks, incidents, templates] = await Promise.all([
      fetchPublishedReports(session, undefined, 25),
      fetchResolvedRisks(session, undefined, 25),
      fetchResolvedIncidents(session, undefined, 25),
      fetchReportTemplates(session, 10),
    ]);

    const articles = buildArticlesFromHistory({ reports, risks, incidents });
    const playbooks = buildPlaybooksFromHistory({ reports, risks, incidents });
    const health = calculateKnowledgeHealth({
      reports,
      risks,
      incidents,
      playbooksCount: playbooks.length,
      articlesCount: articles.length,
    });
    const recommendations = buildKnowledgeRecommendations({ reports, risks, incidents });
    const recentLearnings = [...articles.map((a) => a.relatedEntities[0]).filter(Boolean), ...risks.slice(0, 3)]
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .slice(0, 8);

    return {
      articles,
      playbooks,
      resolvedIncidents: incidents,
      resolvedRisks: risks,
      publishedReports: reports,
      templates,
      recentLearnings,
      health,
      recommendations,
    };
  },
);

export const getClientKnowledgeTimeline = cache(
  async (session: SessionContext, clientId: string): Promise<KnowledgeTimelineEvent[]> => {
    const [reports, risks, incidents] = await Promise.all([
      fetchPublishedReports(session, clientId, 15),
      fetchResolvedRisks(session, clientId, 15),
      fetchResolvedIncidents(session, clientId, 15),
    ]);

    const events: KnowledgeTimelineEvent[] = [
      ...reports.map((item) => ({
        id: `report-${item.entityId}`,
        date: item.date,
        title: item.title,
        kind: item.entityType,
        href: item.href,
        summary: item.excerpt,
      })),
      ...risks.map((item) => ({
        id: `risk-${item.entityId}`,
        date: item.date,
        title: item.title,
        kind: item.entityType,
        href: item.href,
        summary: item.excerpt,
      })),
      ...incidents.map((item) => ({
        id: `incident-${item.entityId}`,
        date: item.date,
        title: item.title,
        kind: item.entityType,
        href: item.href,
        summary: item.excerpt,
      })),
    ];

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
);

export async function buildRelatedKnowledgePanel(
  session: SessionContext,
  input: {
    clientId: string;
    title: string;
    text: string;
    entityType?: "risk" | "incident" | "report";
    entityId?: string;
  },
): Promise<RelatedKnowledgePanel> {
  const hub = await getKnowledgeHubData(session);
  const similar = await findSimilarIssues(session, {
    clientId: input.clientId,
    title: input.title,
    text: input.text,
    limit: 5,
  });

  const relatedReports = hub.publishedReports
    .filter((item) => item.clientId === input.clientId)
    .slice(0, 3);
  const relatedRisks = hub.resolvedRisks
    .filter((item) => item.clientId === input.clientId && item.entityId !== input.entityId)
    .slice(0, 3);
  const relatedIncidents = hub.resolvedIncidents
    .filter((item) => item.clientId === input.clientId && item.entityId !== input.entityId)
    .slice(0, 3);

  const previousResolutions = similar.filter(
    (snippet) => snippet.category === "resolution" || snippet.category === "mitigation",
  );

  const recommendedArticles = hub.articles
    .filter((article) => article.clientId === input.clientId || similar.some((s) => s.sourceId === article.sourceId))
    .slice(0, 3);

  const confidence = Math.min(
    100,
    35 +
      relatedReports.length * 10 +
      relatedRisks.length * 10 +
      relatedIncidents.length * 10 +
      previousResolutions.length * 8,
  );

  return {
    relatedReports,
    relatedRisks,
    relatedIncidents,
    similarIssues: similar,
    previousResolutions,
    recommendedArticles,
    confidence,
  };
}

export async function searchKnowledgeHub(
  session: SessionContext,
  query: string,
  clientId?: string,
) {
  return searchOrganizationalKnowledge(session, query, clientId ? { clientId } : undefined);
}

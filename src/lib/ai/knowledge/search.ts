import type {
  KnowledgeEntityRef,
  KnowledgeSearchFilters,
  KnowledgeSearchResult,
  KnowledgeSnippet,
} from "@/lib/ai/knowledge/types";
import {
  fetchPublishedReports,
  fetchReportTemplates,
  fetchResolvedIncidents,
  fetchResolvedRisks,
} from "@/lib/ai/knowledge/sources";
import { searchWithVectorProvider } from "@/lib/ai/knowledge/vector-interface";
import type { SessionContext } from "@/lib/tenancy/context";

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);
}

function scoreMatch(queryTokens: string[], text: string, title: string): number {
  const haystack = `${title} ${text}`.toLowerCase();
  if (queryTokens.length === 0) return 0;
  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 10;
  }
  if (haystack.includes(queryTokens.join(" "))) score += 20;
  return score;
}

function refToSnippet(ref: KnowledgeEntityRef, score: number): KnowledgeSnippet {
  return {
    id: `${ref.entityType}-${ref.entityId}`,
    sourceType: ref.entityType,
    sourceId: ref.entityId,
    title: ref.title,
    excerpt: ref.excerpt,
    href: ref.href,
    clientId: ref.clientId,
    clientName: ref.clientName,
    relevanceScore: score,
    category:
      ref.entityType === "risk"
        ? "mitigation"
        : ref.entityType === "incident"
          ? "resolution"
          : ref.entityType === "report"
            ? "recommendation"
            : "learning",
    citation: `${ref.title} (${ref.entityType})`,
  };
}

function applyFilters(items: KnowledgeEntityRef[], filters?: KnowledgeSearchFilters): KnowledgeEntityRef[] {
  return items.filter((item) => {
    if (filters?.clientId && item.clientId !== filters.clientId) return false;
    if (filters?.severity && item.severity !== filters.severity) return false;
    if (filters?.dateFrom && item.date < filters.dateFrom) return false;
    if (filters?.dateTo && item.date > filters.dateTo) return false;
    if (filters?.tags?.length) {
      const hasTag = filters.tags.some((tag) => item.tags.includes(tag));
      if (!hasTag) return false;
    }
    return true;
  });
}

export async function searchOrganizationalKnowledge(
  session: SessionContext,
  query: string,
  filters?: KnowledgeSearchFilters,
  limit = 20,
): Promise<KnowledgeSearchResult> {
  const [reports, risks, incidents, templates, vectorResults] = await Promise.all([
    fetchPublishedReports(session, filters?.clientId, 30),
    fetchResolvedRisks(session, filters?.clientId, 30),
    fetchResolvedIncidents(session, filters?.clientId, 30),
    fetchReportTemplates(session, 15),
    searchWithVectorProvider({
      organizationId: session.organization.id,
      query,
      clientId: filters?.clientId,
      limit,
    }),
  ]);

  const corpus = applyFilters([...reports, ...risks, ...incidents, ...templates], filters);
  const tokens = tokenize(query);

  const ranked = corpus
    .map((item) => ({ item, score: scoreMatch(tokens, item.excerpt, item.title) }))
    .filter((entry) => (query.trim() ? entry.score > 0 : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const snippets = [
    ...ranked.map((entry) => refToSnippet(entry.item, entry.score)),
    ...vectorResults,
  ].slice(0, limit);

  return {
    query,
    results: ranked.map((entry) => entry.item),
    snippets,
    totalCount: ranked.length,
    searchedAt: new Date().toISOString(),
  };
}

export async function searchKnowledgeForReport(
  session: SessionContext,
  input: {
    clientId: string;
    queryParts: string[];
    limit?: number;
  },
): Promise<KnowledgeSnippet[]> {
  const query = input.queryParts.filter(Boolean).join(" ");
  const result = await searchOrganizationalKnowledge(
    session,
    query || "recommendations mitigation resolution",
    { clientId: input.clientId },
    input.limit ?? 5,
  );
  return result.snippets;
}

export async function searchKnowledgeForOperational(
  session: SessionContext,
  input: {
    clientId: string;
    entityType: "risk" | "incident";
    title: string;
    description: string;
    limit?: number;
  },
): Promise<KnowledgeSnippet[]> {
  const query = `${input.title} ${input.description} ${input.entityType} mitigation resolution`;
  const result = await searchOrganizationalKnowledge(
    session,
    query,
    { clientId: input.clientId },
    input.limit ?? 5,
  );
  return result.snippets;
}

export async function findSimilarIssues(
  session: SessionContext,
  input: {
    clientId?: string;
    title: string;
    text: string;
    limit?: number;
  },
): Promise<KnowledgeSnippet[]> {
  const result = await searchOrganizationalKnowledge(
    session,
    `${input.title} ${input.text}`,
    input.clientId ? { clientId: input.clientId } : undefined,
    input.limit ?? 5,
  );
  return result.snippets;
}

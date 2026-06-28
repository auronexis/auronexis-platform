/** AI Knowledge Hub — shared types and vector-ready interfaces. */

export type KnowledgeSourceType =
  | "report"
  | "risk"
  | "incident"
  | "activity"
  | "template"
  | "schedule"
  | "client_success"
  | "insight"
  | "automation"
  | "article"
  | "playbook";

export type KnowledgeCategory =
  | "report"
  | "risk"
  | "incident"
  | "mitigation"
  | "resolution"
  | "recommendation"
  | "playbook"
  | "learning";

export type KnowledgeEntityRef = {
  entityType: KnowledgeSourceType;
  entityId: string;
  title: string;
  href: string;
  clientId?: string | null;
  clientName?: string | null;
  date: string;
  severity?: string | null;
  status?: string | null;
  excerpt: string;
  tags: string[];
};

export type KnowledgeSnippet = {
  id: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  title: string;
  excerpt: string;
  href: string;
  clientId?: string | null;
  clientName?: string | null;
  relevanceScore: number;
  category: KnowledgeCategory;
  citation: string;
};

export type KnowledgeSearchFilters = {
  clientId?: string;
  category?: KnowledgeCategory | "all";
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
};

export type KnowledgeSearchResult = {
  query: string;
  results: KnowledgeEntityRef[];
  snippets: KnowledgeSnippet[];
  totalCount: number;
  searchedAt: string;
};

export type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string;
  problem: string;
  resolution: string;
  lessonsLearned: string;
  recommendations: string;
  relatedEntities: KnowledgeEntityRef[];
  generatedFrom: KnowledgeSourceType;
  sourceId: string;
  sourceHref: string;
  createdAt: string;
  updatedAt: string;
  confidence: number;
  clientId?: string | null;
  clientName?: string | null;
};

export type KnowledgePlaybook = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  relatedEntities: KnowledgeEntityRef[];
  generatedFrom: "history" | "template";
  createdAt: string;
  updatedAt: string;
  confidence: number;
};

export type KnowledgeTimelineEvent = {
  id: string;
  date: string;
  title: string;
  kind: KnowledgeSourceType;
  href: string;
  summary: string;
};

export type KnowledgeGap = {
  id: string;
  message: string;
};

export type KnowledgeRecommendation = {
  id: string;
  message: string;
  evidence: string;
  confidence: number;
};

export type KnowledgeHealthScore = {
  score: number;
  label: string;
  reportsLearned: number;
  incidentsLearned: number;
  risksLearned: number;
  playbooksGenerated: number;
  articlesCount: number;
  coveragePercent: number;
  gaps: KnowledgeGap[];
};

export type KnowledgeHubData = {
  articles: KnowledgeArticle[];
  playbooks: KnowledgePlaybook[];
  resolvedIncidents: KnowledgeEntityRef[];
  resolvedRisks: KnowledgeEntityRef[];
  publishedReports: KnowledgeEntityRef[];
  templates: KnowledgeEntityRef[];
  recentLearnings: KnowledgeEntityRef[];
  health: KnowledgeHealthScore;
  recommendations: KnowledgeRecommendation[];
};

export type KnowledgeAnswer = {
  summary: string;
  confidence: number;
  citations: KnowledgeSnippet[];
  referencedReport?: KnowledgeSnippet | null;
  referencedIncident?: KnowledgeSnippet | null;
  referencedRisk?: KnowledgeSnippet | null;
  insufficientData: boolean;
};

export type RelatedKnowledgePanel = {
  relatedReports: KnowledgeEntityRef[];
  relatedRisks: KnowledgeEntityRef[];
  relatedIncidents: KnowledgeEntityRef[];
  similarIssues: KnowledgeSnippet[];
  previousResolutions: KnowledgeSnippet[];
  recommendedArticles: KnowledgeArticle[];
  confidence: number;
};

/** Future vector search interface — pgvector/OpenAI embeddings plug in here. */
export type VectorSearchProvider = {
  search: (input: {
    organizationId: string;
    query: string;
    clientId?: string;
    limit?: number;
  }) => Promise<KnowledgeSnippet[]>;
};

export const KNOWLEDGE_GAP_MESSAGES = {
  noSlaHistory: "No historical SLA breach records found for this scope.",
  noMitigation: "No previous mitigation found in organizational memory.",
  noResolution: "No previous resolution found for similar issues.",
  noReports: "No published reports available for historical context.",
} as const;

export const PLAYBOOK_TITLES = [
  "Critical Incident Response",
  "Ransomware Investigation",
  "Server Outage",
  "Backup Failure",
  "Patch Management",
  "SLA Breach",
  "Executive Reporting",
  "Customer Escalation",
] as const;

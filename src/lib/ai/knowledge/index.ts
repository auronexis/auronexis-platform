export type {
  KnowledgeAnswer,
  KnowledgeArticle,
  KnowledgeEntityRef,
  KnowledgeGap,
  KnowledgeHealthScore,
  KnowledgeHubData,
  KnowledgePlaybook,
  KnowledgeRecommendation,
  KnowledgeSearchResult,
  KnowledgeSnippet,
  KnowledgeTimelineEvent,
  RelatedKnowledgePanel,
  VectorSearchProvider,
} from "@/lib/ai/knowledge/types";
export { KNOWLEDGE_GAP_MESSAGES, PLAYBOOK_TITLES } from "@/lib/ai/knowledge/types";
export {
  getKnowledgeHubData,
  getClientKnowledgeTimeline,
  buildRelatedKnowledgePanel,
  searchKnowledgeHub,
} from "@/lib/ai/knowledge/get-hub";
export {
  searchKnowledgeForReport,
  searchKnowledgeForOperational,
  searchOrganizationalKnowledge,
  findSimilarIssues,
} from "@/lib/ai/knowledge/search";
export { formatKnowledgeBlock, buildKnowledgeInfluenceNotice } from "@/lib/ai/knowledge/prompts";
export {
  searchKnowledgeServerAction,
  answerKnowledgeQuestionServerAction,
  generateKnowledgeArticleServerAction,
  generatePlaybookServerAction,
} from "@/lib/ai/knowledge/action";
export {
  getVectorSearchProvider,
  setVectorSearchProvider,
} from "@/lib/ai/knowledge/vector-interface";

import type { KnowledgeSnippet, VectorSearchProvider } from "@/lib/ai/knowledge/types";

/**
 * Vector search stub — replace implementation with pgvector/OpenAI embeddings.
 * Current phase uses keyword search in search.ts instead.
 */
export const keywordVectorSearchProvider: VectorSearchProvider = {
  async search() {
    return [];
  },
};

let activeVectorProvider: VectorSearchProvider = keywordVectorSearchProvider;

export function setVectorSearchProvider(provider: VectorSearchProvider): void {
  activeVectorProvider = provider;
}

export function getVectorSearchProvider(): VectorSearchProvider {
  return activeVectorProvider;
}

export async function searchWithVectorProvider(input: {
  organizationId: string;
  query: string;
  clientId?: string;
  limit?: number;
}): Promise<KnowledgeSnippet[]> {
  return activeVectorProvider.search(input);
}

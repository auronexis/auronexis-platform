import type { KnowledgeSnippet } from "@/lib/ai/knowledge/types";

export function formatKnowledgeBlock(
  snippets: KnowledgeSnippet[],
  heading = "Organizational memory (verified only)",
): string {
  if (snippets.length === 0) {
    return `${heading}:\nNo matching historical knowledge found. Do not invent prior events.`;
  }

  const lines = snippets.map(
    (snippet) =>
      `- [${snippet.citation}] ${snippet.excerpt} (source: ${snippet.href}, relevance: ${snippet.relevanceScore})`,
  );

  return [
    `${heading}:`,
    "Use only the historical records below. Cite the source entity when relevant.",
    "If none apply, state that no verified historical knowledge was found.",
    ...lines,
  ].join("\n");
}

export function buildKnowledgeInfluenceNotice(snippets: KnowledgeSnippet[]): string | null {
  if (snippets.length === 0) return null;
  return `Historical knowledge influenced this output (${snippets.length} verified reference${snippets.length === 1 ? "" : "s"}).`;
}

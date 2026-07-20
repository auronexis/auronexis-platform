import type { AISmartSuggestion } from "@/lib/ai/types";

type ReportAISuggestionsProps = {
  suggestions: AISmartSuggestion[];
};

export function ReportAISuggestions({ suggestions }: ReportAISuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section aria-label="Smart suggestions" className="rounded-lg border border-border bg-surface/80 p-4">
      <p className="text-sm font-medium text-foreground">Smart suggestions</p>
      <ul className="mt-3 space-y-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id} className="text-xs leading-relaxed text-muted">
            {suggestion.message}
          </li>
        ))}
      </ul>
    </section>
  );
}

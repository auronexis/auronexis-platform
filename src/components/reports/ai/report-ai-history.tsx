import { AIHistory } from "@/components/ai/ai-history";

import {

  REPORT_AI_ACTION_LABELS,

  REPORT_AI_SECTION_LABELS,

  type AIHistoryEntry,

  type ReportAIActionKey,

} from "@/lib/ai/types";



type ReportAIHistoryProps = {

  history: AIHistoryEntry[];

  onReapply: (entry: AIHistoryEntry) => void;

  onCopy: (entry: AIHistoryEntry) => void;

  onDelete: (id: string) => void;

  onRetry?: (entry: AIHistoryEntry) => void;

};



/** Report copilot history — uses shared AIHistory. */

export function ReportAIHistory({ history, onReapply, onCopy, onDelete, onRetry }: ReportAIHistoryProps) {

  return (

    <AIHistory

      entries={history.map((entry) => ({

        ...entry,

        label: REPORT_AI_ACTION_LABELS[entry.action as ReportAIActionKey] ?? entry.action,

        sublabel: entry.section ? REPORT_AI_SECTION_LABELS[entry.section] : undefined,

      }))}

      onReapply={(entry) => onReapply(entry as AIHistoryEntry)}

      onCopy={(entry) => onCopy(entry as AIHistoryEntry)}

      onDelete={onDelete}

      onRetry={onRetry ? (entry) => onRetry(entry as AIHistoryEntry) : undefined}

    />

  );

}



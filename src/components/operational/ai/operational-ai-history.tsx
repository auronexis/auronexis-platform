import { AIHistory } from "@/components/ai/ai-history";

import {

  INCIDENT_AI_ACTION_LABELS,

  RISK_AI_ACTION_LABELS,

  OPERATIONAL_FIELD_LABELS,

  type OperationalAIActionKey,

  type OperationalHistoryEntry,

} from "@/lib/ai/operational/types";



type OperationalAIHistoryProps = {

  entityType: "risk" | "incident";

  history: OperationalHistoryEntry[];

  onReapply: (entry: OperationalHistoryEntry) => void;

  onCopy: (entry: OperationalHistoryEntry) => void;

  onDelete: (id: string) => void;

  onRetry?: (entry: OperationalHistoryEntry) => void;

};



function actionLabel(entityType: "risk" | "incident", action: OperationalAIActionKey): string {

  if (entityType === "risk") {

    return RISK_AI_ACTION_LABELS[action as keyof typeof RISK_AI_ACTION_LABELS] ?? action;

  }

  return INCIDENT_AI_ACTION_LABELS[action as keyof typeof INCIDENT_AI_ACTION_LABELS] ?? action;

}



/** Operational copilot history — uses shared AIHistory. */

export function OperationalAIHistory({

  entityType,

  history,

  onReapply,

  onCopy,

  onDelete,

  onRetry,

}: OperationalAIHistoryProps) {

  return (

    <AIHistory

      entries={history.map((entry) => ({

        ...entry,

        label: actionLabel(entityType, entry.action),

        sublabel: entry.field ? OPERATIONAL_FIELD_LABELS[entry.field] : undefined,

      }))}

      onReapply={(entry) => onReapply(entry as OperationalHistoryEntry)}

      onCopy={(entry) => onCopy(entry as OperationalHistoryEntry)}

      onDelete={onDelete}

      onRetry={onRetry ? (entry) => onRetry(entry as OperationalHistoryEntry) : undefined}

    />

  );

}



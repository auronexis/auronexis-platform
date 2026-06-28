import "server-only";

import { rowToWorkflowDefinition } from "@/lib/automation/storage/types";
import { listActiveWorkflowsByTrigger } from "@/lib/automation/storage/queries";
import type { ActiveWorkflowCandidate } from "@/lib/automation/engine-v2/types";
import type { AutomationRepositoryContext } from "@/lib/automation/storage/types";

export async function loadActiveWorkflowsForTrigger(
  ctx: AutomationRepositoryContext,
  triggerType: string,
): Promise<ActiveWorkflowCandidate[]> {
  const rows = await listActiveWorkflowsByTrigger(ctx, triggerType);
  return rows.map((row) => ({
    rowId: row.id,
    workflow: rowToWorkflowDefinition(row),
  }));
}

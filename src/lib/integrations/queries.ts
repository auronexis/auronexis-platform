import "server-only";

import type {
  IntegrationDeliveryLogView,
  IntegrationsDashboardSummary,
  IntegrationRuntimeDashboardSummary,
} from "@/lib/integrations/types";
import { getIntegrationRuntimeDashboardSummary } from "@/lib/integrations/execution/health";
import { listDeliveryLogs } from "@/lib/integrations/execution/logging";
import { listWorkflowRows } from "@/lib/automation/storage/queries";
import { rowToWorkflowDefinition } from "@/lib/automation/storage/types";
import {
  getIntegrationsDiagnostics,
  INTEGRATION_ACTION_TYPES,
  isIntegrationActionType,
} from "@/lib/integrations/simulation";

export async function getIntegrationRuntimeSummary(input: {
  organizationId: string;
}): Promise<IntegrationRuntimeDashboardSummary> {
  return getIntegrationRuntimeDashboardSummary(input.organizationId);
}

export async function getIntegrationDeliveryLogs(input: {
  organizationId: string;
  limit?: number;
}): Promise<IntegrationDeliveryLogView[]> {
  return listDeliveryLogs(input);
}

export async function getIntegrationsDashboardSummary(input: {
  organizationId: string;
  userId: string;
}): Promise<IntegrationsDashboardSummary> {
  const diagnostics = getIntegrationsDiagnostics();
  const workflowRows = await listWorkflowRows(input);
  const workflows = workflowRows.map(rowToWorkflowDefinition);

  let workflowIntegrationActionCount = 0;
  for (const workflow of workflows) {
    for (const action of workflow.actions) {
      if (isIntegrationActionType(action.type)) {
        workflowIntegrationActionCount += 1;
      }
    }
  }

  return {
    registeredCount: diagnostics.registeredProviderCount,
    configuredCount: diagnostics.configuredProviderCount,
    readyCount: diagnostics.readyProviderCount,
    simulationStatus: diagnostics.simulationEnabled ? "available" : "disabled",
    workflowIntegrationActionCount,
  };
}

export function countIntegrationActionTypesInWorkflows(
  workflows: Array<{ actions: Array<{ type: string }> }>,
): number {
  return workflows.reduce((count, workflow) => {
    return (
      count +
      workflow.actions.filter((action) => isIntegrationActionType(action.type)).length
    );
  }, 0);
}

export { INTEGRATION_ACTION_TYPES };

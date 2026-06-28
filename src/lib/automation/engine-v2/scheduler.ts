/** Queue placeholder for future async execution engine. */
export const WORKFLOW_ENGINE_QUEUE_STATUS = "inline" as const;

export function getSchedulerStatus() {
  return {
    queueStatus: WORKFLOW_ENGINE_QUEUE_STATUS,
    pendingJobs: 0,
  };
}

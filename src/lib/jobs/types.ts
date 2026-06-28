export type JobId =
  | "report_schedules"
  | "sla_alerts"
  | "connector_sync"
  | "billing_snapshots"
  | "predictive_refresh"
  | "automation_maintenance"
  | "retention_cleanup"
  | "queue_worker";

export type JobExecutionStatus = "pending" | "running" | "completed" | "failed";

export type JobHealthStatus = "healthy" | "degraded" | "unavailable";

export type JobDefinition = {
  id: JobId;
  name: string;
  description: string | null;
  scheduleCron: string | null;
  enabled: boolean;
};

export type JobSchedule = {
  jobId: JobId;
  nextRunAt: string;
  lastRunAt: string | null;
};

export type JobExecution = {
  id: string;
  jobId: JobId;
  organizationId: string | null;
  status: JobExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
};

export type JobRunResult = {
  jobId: JobId;
  status: "completed" | "failed" | "skipped";
  durationMs: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

export type CronDiagnosticsSnapshot = {
  tableReachable: boolean;
  registeredJobs: number;
  enabledJobs: number;
  failedJobsLast24h: number;
  averageDurationMs: number | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  queueBacklog: number;
  status: JobHealthStatus;
  jobs: Array<{
    id: JobId;
    name: string;
    enabled: boolean;
    scheduleCron: string | null;
    nextRunAt: string | null;
    lastRunAt: string | null;
    lastStatus: JobExecutionStatus | null;
    failedCount24h: number;
  }>;
};

export type QueueName =
  | "emails"
  | "ai_generation"
  | "automation_execution"
  | "connector_sync"
  | "webhook_delivery"
  | "predictive_refresh"
  | "billing_sync"
  | "reports";

export type QueueJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

export type QueueJob = {
  id: string;
  queueName: QueueName;
  organizationId: string | null;
  jobType: string;
  payload: Record<string, unknown>;
  status: QueueJobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  idempotencyKey: string | null;
};

export type QueueDiagnosticsSnapshot = {
  tableReachable: boolean;
  jobsPending: number;
  jobsRunning: number;
  jobsFailed: number;
  jobsRetried: number;
  deadLetters: number;
  averageProcessingTimeMs: number | null;
  status: JobHealthStatus;
  queues: Array<{
    name: QueueName;
    pending: number;
    running: number;
    failed: number;
    paused: number;
  }>;
};

export type ProductionReadinessSnapshot = {
  overallScore: number;
  label:
    | "Not Ready"
    | "Pilot Ready"
    | "Production Ready"
    | "Pilot Execution Ready"
    | "Go-Live Ready";
  stripeReadiness: number;
  cronReadiness: number;
  queueReadiness: number;
  oauthReadiness: number;
  connectorReadiness: number;
  billingReadiness: number;
  apiReadiness: number;
  complianceReadiness: number;
  aiReadiness: number;
  predictiveReadiness: number;
  launchPolishReadiness: number;
  pilotAcquisitionReadiness: number;
  deploymentReadiness: number;
  pilotExecutionReadiness: number;
  goLiveReadiness: number;
};

import "server-only";

import type { JobId, JobDefinition } from "@/lib/jobs/types";

export const JOB_REGISTRY: JobDefinition[] = [
  {
    id: "report_schedules",
    name: "Report schedules",
    description: "Generate draft reports for due schedules",
    scheduleCron: "0 * * * *",
    enabled: true,
  },
  {
    id: "sla_alerts",
    name: "SLA alerts",
    description: "Evaluate SLA breaches and dispatch alerts",
    scheduleCron: "*/15 * * * *",
    enabled: true,
  },
  {
    id: "connector_sync",
    name: "Connector sync",
    description: "Run scheduled connector synchronizations",
    scheduleCron: "0 */6 * * *",
    enabled: true,
  },
  {
    id: "billing_snapshots",
    name: "Billing snapshots",
    description: "Record subscription usage snapshots",
    scheduleCron: "0 2 * * *",
    enabled: true,
  },
  {
    id: "predictive_refresh",
    name: "Predictive refresh",
    description: "Refresh predictive intelligence forecasts",
    scheduleCron: "0 3 * * *",
    enabled: true,
  },
  {
    id: "automation_maintenance",
    name: "Automation maintenance",
    description: "Prune stale automation execution metadata",
    scheduleCron: "0 4 * * 0",
    enabled: true,
  },
  {
    id: "retention_cleanup",
    name: "Retention cleanup",
    description: "Simulate retention impact (no auto-delete)",
    scheduleCron: "0 5 1 * *",
    enabled: true,
  },
  {
    id: "webhook_retries",
    name: "Webhook retries",
    description: "Retry pending outbound webhook deliveries",
    scheduleCron: "*/5 * * * *",
    enabled: true,
  },
  {
    id: "queue_worker",
    name: "Queue worker",
    description: "Process pending background queue jobs",
    scheduleCron: "*/5 * * * *",
    enabled: true,
  },
];

export function getJobDefinition(jobId: JobId): JobDefinition | undefined {
  return JOB_REGISTRY.find((job) => job.id === jobId);
}

export function listRegisteredJobIds(): JobId[] {
  return JOB_REGISTRY.map((job) => job.id);
}

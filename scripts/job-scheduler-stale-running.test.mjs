/**
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/job-scheduler-stale-running.test.mjs
 *
 * Regression: a single "running" job_executions row left behind by a killed invocation
 * blocked 7 of 9 cron jobs from 2026-09-14 (reports, SLA alerts, webhook retries, queue).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const scheduler = readSource("src/lib/jobs/scheduler.ts");
const cronRoute = readSource("src/app/api/cron/run/route.ts");
const maintenance = readSource("src/lib/jobs/handlers/automation-maintenance.ts");

test("only recent running executions block a job", () => {
  assert.match(scheduler, /STALE_RUNNING_EXECUTION_MS = 30 \* 60 \* 1000/);
  const fn = scheduler.slice(scheduler.indexOf("export async function hasRunningJobExecution"));
  assert.match(fn, /await failStaleRunningJobExecutions\(jobId\)/);
  assert.match(fn, /\.gte\("started_at", cutoff\)/);
});

test("stale running executions are marked failed, scoped to the job", () => {
  const fn = scheduler.slice(
    scheduler.indexOf("export async function failStaleRunningJobExecutions"),
    scheduler.indexOf("export async function hasRunningJobExecution"),
  );
  assert.match(fn, /status: "failed"/);
  assert.match(fn, /\.eq\("job_id", jobId\)/);
  assert.match(fn, /\.eq\("status", "running"\)/);
  assert.match(fn, /\.lt\("started_at", cutoff\)/);
});

test("cron route declares a max duration", () => {
  assert.match(cronRoute, /export const maxDuration = 300;/);
});

test("job log retention only prunes completed rows", () => {
  assert.match(maintenance, /\.from\("job_executions"\)\s*\.delete\(\)\s*\.eq\("status", "completed"\)/);
  assert.match(maintenance, /JOB_LOG_RETENTION_DAYS = 60/);
});

/**
 * Cron ticks stay cheap when there is nothing to do: schedules are read in one query,
 * idle polling jobs are skipped without writes, and schedules no longer drift to every
 * second tick.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/cron-idle-ticks.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const scheduler = await import("@/lib/jobs/scheduler");

describe("schedule timing", () => {
  it("a job without a schedule row is due; future runs are not", () => {
    const now = Date.parse("2026-10-28T10:00:00Z");
    assert.equal(scheduler.isScheduleDue(null, now), true);
    assert.equal(scheduler.isScheduleDue({ nextRunAt: "2026-10-28T09:59:59Z" }, now), true);
    assert.equal(scheduler.isScheduleDue({ nextRunAt: "2026-10-28T10:00:01Z" }, now), false);
  });

  it("next run leaves room for late ticks (capped at a fifth of the interval)", () => {
    const now = new Date("2026-10-28T10:00:18Z");
    // 5-minute job: due again at the next tick (10:05:00 + 18 s lateness is fine)
    assert.equal(scheduler.computeNextRunAt("queue_worker", now).toISOString(), "2026-10-28T10:04:18.000Z");
    // 15-minute job: 14 min after the run
    assert.equal(scheduler.computeNextRunAt("sla_alerts", now).toISOString(), "2026-10-28T10:14:18.000Z");
    // daily job: grace is one minute
    assert.equal(scheduler.computeNextRunAt("billing_snapshots", now).toISOString(), "2026-10-29T09:59:18.000Z");
  });
});

describe("dispatcher", () => {
  const dispatcher = readSource("src/lib/jobs/dispatcher.ts");

  it("reads all schedules once per tick and does not re-check due jobs", () => {
    assert.match(dispatcher, /const schedules = await listJobSchedules\(\);/);
    assert.match(dispatcher, /dispatchJob\(jobId, \{ knownDue: true \}\)/);
    assert.match(dispatcher, /!options\?\.knownDue && !\(await isJobDue\(jobId\)\)/);
  });

  it("skips idle polling jobs before any execution row is written", () => {
    assert.match(dispatcher, /webhook_retries: hasDueWebhookDeliveries/);
    assert.match(dispatcher, /queue_worker: hasPendingQueueJobs/);
    const precheck = dispatcher.indexOf("await precheck()");
    const dispatch = dispatcher.indexOf("dispatchJob(jobId, { knownDue: true })");
    assert.ok(precheck > 0 && precheck < dispatch);
    assert.match(dispatcher, /reason: "no_work"/);
  });

  it("prechecks use the same filters as the real work and fail open", () => {
    const webhooks = readSource("src/lib/webhooks/queries.ts");
    const queue = readSource("src/lib/queue/repository.ts");
    assert.match(webhooks, /hasDueWebhookDeliveries[\s\S]*?\.in\("status", \["pending", "retrying"\]\)[\s\S]*?if \(error\) return true;/);
    assert.match(queue, /hasPendingQueueJobs[\s\S]*?\.eq\("status", "pending"\)[\s\S]*?\.lte\("scheduled_at"[\s\S]*?if \(error\) return true;/);
  });

  it("the Vercel cron still ticks every 5 minutes", () => {
    const config = JSON.parse(readSource("vercel.json"));
    assert.equal(config.crons.find((cron) => cron.path === "/api/cron/run")?.schedule, "*/5 * * * *");
  });
});

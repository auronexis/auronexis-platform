import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("public status uses short TTL cache with in-flight dedupe", () => {
  const publicStatus = readSource("src/lib/marketing/public-status.ts");
  const page = readSource("src/app/(marketing)/status/page.tsx");

  assert.match(publicStatus, /PUBLIC_STATUS_CACHE_TTL_MS\s*=\s*45_000/);
  assert.match(publicStatus, /inFlightSnapshot/);
  assert.match(publicStatus, /cachedSnapshot/);
  assert.match(publicStatus, /export async function getLiveStatusOverrides/);
  assert.match(publicStatus, /computeLiveStatusOverrides/);
  assert.match(page, /getLiveStatusOverrides/);
  assert.match(page, /force-dynamic/);
});

test("public status parallelizes probes with per-probe timeout", () => {
  const publicStatus = readSource("src/lib/marketing/public-status.ts");

  assert.match(publicStatus, /PROBE_TIMEOUT_MS\s*=\s*3_000/);
  assert.match(publicStatus, /withProbeTimeout/);
  assert.match(publicStatus, /Promise\.allSettled/);
  assert.match(publicStatus, /checkDatabaseHealth/);
  assert.match(publicStatus, /getPublicQueueHealthSummary/);
  assert.match(publicStatus, /resolvePublicAiStatus/);
  assert.doesNotMatch(publicStatus, /getCronDiagnosticsSnapshot/);
  assert.doesNotMatch(publicStatus, /getQueueDiagnosticsSnapshot/);
});

test("public queue health summary avoids per-queue status fan-out", () => {
  const queueHealth = readSource("src/lib/queue/health.ts");
  const queueIndex = readSource("src/lib/queue/index.ts");

  assert.match(queueHealth, /export async function getPublicQueueHealthSummary/);
  assert.match(queueHealth, /countPendingQueueJobs/);
  assert.match(queueHealth, /countQueueJobsByStatus\("failed"\)/);
  assert.doesNotMatch(
    queueHealth.slice(
      queueHealth.indexOf("export async function getPublicQueueHealthSummary"),
      queueHealth.indexOf("export async function getQueueDiagnosticsSnapshot"),
    ),
    /QUEUE_NAMES\.map/,
  );
  assert.match(queueHealth, /export async function getQueueDiagnosticsSnapshot/);
  assert.match(queueHealth, /QUEUE_NAMES\.map/);
  assert.match(queueIndex, /getPublicQueueHealthSummary/);
});

test("public status fail-safe maps probe failures to unknown without leaking internals", () => {
  const publicStatus = readSource("src/lib/marketing/public-status.ts");

  assert.match(publicStatus, /unknownComponent/);
  assert.match(publicStatus, /Status check unavailable/);
  assert.match(publicStatus, /publicSafeDatabaseDetail/);
  assert.doesNotMatch(publicStatus, /database\.message/);
  assert.doesNotMatch(publicStatus, /\.stack/);
  assert.match(publicStatus, /component\.status === "unknown"/);
});

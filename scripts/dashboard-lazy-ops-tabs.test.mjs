/**
 * Dashboard speed: hidden Ops tabs load on demand, repeated loaders are memoized per request,
 * the adoption automation-runs count uses a column that exists, and slow renders are logged.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/dashboard-lazy-ops-tabs.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { startPhaseTimer } = await import("@/lib/observability/phase-timer");

describe("dashboard Ops tabs", () => {
  const page = readSource("src/app/(dashboard)/dashboard/page.tsx");

  it("the page no longer renders the hidden tabs on the server", () => {
    assert.doesNotMatch(page, /<DashboardOpsIntelligenceTab/);
    assert.doesNotMatch(page, /<DashboardOpsAutomationTab/);
    assert.doesNotMatch(page, /<DashboardOpsGovernanceTab/);
    for (const tab of ["intelligence", "automation", "governance"]) {
      assert.match(page, new RegExp(`<LazyOpsTabPanel tab="${tab}"`));
    }
  });

  it("the server action allowlists the tab and derives access from the session", () => {
    const action = readSource("src/app/(dashboard)/dashboard/ops-tab-actions.tsx");
    assert.match(action, /^"use server";/);
    assert.ok(action.indexOf("isLazyOpsTab(tab)") < action.indexOf("requireSession()"));
    assert.match(action, /resolveOpsTabAccess\(session\)/);
    assert.doesNotMatch(action, /access\s*:\s*unknown|tab: string, access/);
  });

  it("the client panel is mounted per tab and offers a retry", () => {
    const panel = readSource("src/components/dashboard/lazy-ops-tab-panel.tsx");
    assert.match(panel, /^"use client";/);
    assert.match(panel, /loadDashboardOpsTab\(tab\)/);
    assert.match(panel, /Try again/);
  });

  it("only allowlisted tab names are accepted", () => {
    const access = readSource("src/lib/dashboard/ops-tab-access.ts");
    assert.match(access, /LAZY_OPS_TABS = \["intelligence", "automation", "governance"\] as const/);
  });
});

describe("request-level dedupe and correctness", () => {
  it("operational tasks are memoized and load their two queries in parallel", () => {
    const tasks = readSource("src/lib/ai/operational/tasks.ts");
    assert.match(tasks, /export const buildOperationalTasks = cache\(/);
    assert.match(tasks, /await Promise\.all\(\[\s*supabase\s*\.from\("incidents"\)/);
  });

  it("automation runs are counted by started_at (the table has no created_at)", () => {
    const adoption = readSource("src/lib/adoption/queries.ts");
    assert.match(
      adoption,
      /countRows\("automation_executions", organizationId, undefined, since30d, "started_at"\)/,
    );
  });
});

describe("phase timer", () => {
  it("records phases and logs only above the threshold", () => {
    let t = 0;
    const timer = startPhaseTimer(() => t);
    t = 400;
    timer.mark("data");
    t = 1000;
    timer.mark("guidance");
    const logged = [];
    const original = console.info;
    console.info = (line) => logged.push(line);
    try {
      assert.equal(timer.logIfSlow("/dashboard"), false);
      t = 2000;
      assert.equal(timer.logIfSlow("/dashboard"), true);
    } finally {
      console.info = original;
    }
    assert.equal(logged.length, 1);
    assert.match(logged[0], /^\[slow-page\] /);
    const payload = JSON.parse(logged[0].replace("[slow-page] ", ""));
    assert.deepEqual(payload, { route: "/dashboard", totalMs: 2000, phases: { data: 400, guidance: 600 } });
  });
});

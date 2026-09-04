/**
 * Source contract: dashboard UX density progressive disclosure wiring.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("dashboard page uses OperationsCenter progressive disclosure", () => {
  const page = readSource("src/app/(dashboard)/dashboard/page.tsx");
  assert.match(page, /OperationsCenter/);
  assert.match(page, /defaultTabId="overview"/);
  assert.match(page, /id: "intelligence"/);
  assert.match(page, /id: "automation"/);
  assert.match(page, /id: "governance"/);
  assert.match(page, /More executive intelligence/);
  assert.doesNotMatch(page, /min-h-\[320px\]/);
  assert.doesNotMatch(page, /min-h-\[360px\]/);
});

test("operations center is a client tablist with hidden inactive panels", () => {
  const source = readSource("src/components/dashboard/operations-center.tsx");
  assert.match(source, /"use client"/);
  assert.match(source, /role="tablist"/);
  assert.match(source, /hidden=\{!selected\}/);
  assert.match(source, /data-operations-center/);
});

test("customer success center uses compact KPI grid", () => {
  const source = readSource("src/components/dashboard/customer-success-center.tsx");
  assert.match(source, /data-customer-success-center/);
  assert.match(source, /xl:grid-cols-6/);
  assert.doesNotMatch(source, /xl:grid-cols-3/);
});

test("empty state supports compact density for dashboard panels", () => {
  const source = readSource("src/components/ui/empty-state.tsx");
  assert.match(source, /density\?: \"default\" \| \"compact\"/);
  assert.match(source, /min-h-\[10rem\]/);
});

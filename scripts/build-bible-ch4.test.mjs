import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 4 design system doc and rule exist", () => {
  assert.ok(existsSync(join(rootDir, "docs/06_BUILD_BIBLE_V2_CHAPTER_04_DESIGN_SYSTEM.md")));
  const rule = readSource(".cursor/rules/build-bible-v2-ch4-design-system.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /Merge duplicate UI/);
});

test("StatusBadge primitive exists and domain badges compose it", () => {
  const badge = readSource("src/components/ui/badge.tsx");
  const client = readSource("src/components/clients/client-status-badge.tsx");
  const risk = readSource("src/components/risks/risk-status-badge.tsx");
  const incident = readSource("src/components/incidents/incident-badge.tsx");
  assert.match(badge, /export function StatusBadge/);
  assert.match(client, /StatusBadge/);
  assert.match(risk, /StatusBadge/);
  assert.match(incident, /StatusBadge/);
});

test("Button and LinkButton share button-styles tokens", () => {
  const styles = readSource("src/lib/ui/button-styles.ts");
  const button = readSource("src/components/ui/button.tsx");
  const link = readSource("src/components/ui/link-button.tsx");
  assert.match(styles, /buttonVariantStyles/);
  assert.match(button, /buttonVariantStyles/);
  assert.match(link, /buttonVariantStyles/);
  assert.doesNotMatch(link, /border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover/);
});

test("form controls share form-tokens chrome", () => {
  const tokens = readSource("src/lib/ui/form-tokens.ts");
  const input = readSource("src/components/ui/input.tsx");
  const select = readSource("src/components/ui/select.tsx");
  const textarea = readSource("src/components/ui/textarea.tsx");
  assert.match(tokens, /export const formControl/);
  assert.match(input, /formControl/);
  assert.match(select, /formControl/);
  assert.match(textarea, /formControl/);
});

test("dead LoadingButton shim is removed", () => {
  assert.equal(existsSync(join(rootDir, "src/components/ui/loading-button.tsx")), false);
  const index = readSource("src/components/ui/index.ts");
  assert.doesNotMatch(index, /LoadingButton/);
  assert.match(index, /StatusBadge/);
  assert.match(index, /LinkButton/);
});

test("dead aurora-primitives and unused card exports are removed", () => {
  assert.equal(existsSync(join(rootDir, "src/components/ui/aurora-primitives.tsx")), false);
  const index = readSource("src/components/ui/index.ts");
  assert.doesNotMatch(index, /DataTableShell|InteractiveCardLink|ClickableCard/);
  assert.match(index, /MetricCardGrid/);
});

test("sales metric cards share MetricCardGrid", () => {
  const acquisition = readSource("src/components/sales/acquisition-metric-cards.tsx");
  const pipeline = readSource("src/components/sales/pipeline-metric-cards.tsx");
  const execution = readSource("src/components/sales/sales-execution-metric-cards.tsx");
  assert.match(acquisition, /MetricCardGrid/);
  assert.match(pipeline, /MetricCardGrid/);
  assert.match(execution, /MetricCardGrid/);
  assert.doesNotMatch(acquisition, /aurora-surface/);
});

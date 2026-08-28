/**
 * Regression: AI Builder "Run simulation" must not INSERT automation_executions
 * for a client-only workflow.id before the parent automation_workflows row exists.
 *
 * Bug: FK automation_executions_workflow_id_fkey when Save draft was never clicked.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("recordSimulationExecution ensures parent workflow before execution insert", () => {
  const source = readSource("src/lib/automation/storage/executions.ts");

  const fnStart = source.indexOf("export async function recordSimulationExecution");
  assert.ok(fnStart >= 0, "recordSimulationExecution must exist");

  const nextExport = source.indexOf("\nexport async function", fnStart + 1);
  const fnBody = nextExport >= 0 ? source.slice(fnStart, nextExport) : source.slice(fnStart);

  assert.match(fnBody, /getWorkflowRow/, "must check parent workflow existence");
  assert.match(
    fnBody,
    /upsertWorkflowRecord/,
    "must persist missing parent via upsertWorkflowRecord before execution insert",
  );

  const upsertIdx = fnBody.indexOf("upsertWorkflowRecord");
  const insertIdx = fnBody.indexOf('.from("automation_executions")');
  assert.ok(upsertIdx >= 0 && insertIdx >= 0, "upsert and execution insert must both be present");
  assert.ok(
    upsertIdx < insertIdx,
    "PARENT_WORKFLOW_EXISTS_BEFORE_EXECUTION_INSERT: upsert must precede automation_executions insert",
  );

  assert.match(
    fnBody,
    /if\s*\(\s*!existingWorkflow\s*\)/,
    "must only create when parent is missing (avoid version spam on every simulation)",
  );
});

test("builder Run simulation is independent of Save draft", () => {
  const ui = readSource("src/components/automation/automation-builder-workspace.tsx");

  assert.match(ui, /Run simulation/);
  assert.match(ui, /Save draft/);
  assert.match(ui, /handleSimulate/);
  assert.match(ui, /recordSimulation\(/);

  const simulateStart = ui.indexOf("const handleSimulate");
  assert.ok(simulateStart >= 0);
  const saveStart = ui.indexOf("const handleSave", simulateStart);
  const simulateBody = saveStart >= 0 ? ui.slice(simulateStart, saveStart) : ui.slice(simulateStart);

  assert.match(simulateBody, /recordSimulation/);
  assert.doesNotMatch(
    simulateBody,
    /saveWorkflow|handleSave/,
    "Run simulation must not require Save draft in the UI handler",
  );
});

test("createExecution still requires existing parent (live path unchanged)", () => {
  const source = readSource("src/lib/automation/storage/executions.ts");
  const fnStart = source.indexOf("export async function createExecution");
  assert.ok(fnStart >= 0);
  const nextExport = source.indexOf("\nexport async function", fnStart + 1);
  const fnBody = nextExport >= 0 ? source.slice(fnStart, nextExport) : source.slice(fnStart);

  assert.match(fnBody, /getWorkflowRow/);
  assert.match(fnBody, /Workflow not found/);
  assert.doesNotMatch(
    fnBody,
    /upsertWorkflowRecord/,
    "live createExecution must not auto-create workflows",
  );
});

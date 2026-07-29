import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("executive brief does not bake timezone greeting into SSR payload", () => {
  const recommendations = readSource("src/lib/intelligence/recommendations.ts");
  const types = readSource("src/lib/intelligence/types.ts");
  const panel = readSource("src/components/dashboard/executive-brief.tsx");
  const greeting = readSource("src/components/dashboard/time-of-day-greeting.tsx");

  assert.doesNotMatch(recommendations, /getTimeGreeting/);
  assert.doesNotMatch(types, /greeting\s*:/);
  assert.match(panel, /TimeOfDayGreeting/);
  assert.match(greeting, /useState<string \| null>\(null\)/);
  assert.match(greeting, /setGreeting\(getTimeGreeting\(\)\)/);
  assert.doesNotMatch(greeting, /suppressHydrationWarning/);
});

test("command center greeting uses client post-hydration time greeting without suppressHydrationWarning", () => {
  const command = readSource("src/components/dashboard/command-center-greeting.tsx");
  assert.match(command, /TimeOfDayGreeting/);
  assert.doesNotMatch(command, /suppressHydrationWarning/);
  assert.doesNotMatch(command, /getTimeGreeting/);
});

test("notification timestamps use fixed UTC locale for deterministic SSR/client text", () => {
  const types = readSource("src/lib/notifications/types.ts");
  assert.match(types, /formatAppDateTime\(value,\s*\{\s*locale:\s*"en",\s*timeZone:\s*"UTC",\s*timeFormat:\s*"24h"\s*\}\)/);
});

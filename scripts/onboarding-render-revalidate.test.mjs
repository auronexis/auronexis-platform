/**
 * Regression: /onboarding records the visit while rendering; revalidatePath during render throws
 * in Next.js 15 and filled the logs with errors (Sentry issue, 25.10.2026).
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/onboarding-render-revalidate.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("recordOnboardingViewAction does not revalidate (it runs during render)", () => {
  const source = readSource("src/lib/activation/actions.ts");
  const fn = source.match(/export async function recordOnboardingViewAction[\s\S]*?\n}\n/)?.[0] ?? "";
  assert.ok(fn.length > 0);
  assert.doesNotMatch(fn, /revalidatePath\(/);
});

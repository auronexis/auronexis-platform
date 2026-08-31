/**
 * Free / unpaid workspace plan truth — fail closed.
 * New workspaces without a paid subscription must resolve to Free, never Professional.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("starter internal key display name is Free — not Professional", () => {
  const plans = readSource("src/lib/billing/plans.ts");
  const starterBlock = plans.slice(
    plans.indexOf('key: "starter"'),
    plans.indexOf('key: "professional"'),
  );
  assert.match(starterBlock, /name:\s*"Free"/);
  assert.doesNotMatch(starterBlock, /name:\s*"Professional"/);
  assert.match(starterBlock, /Internal unpaid baseline/);

  const professionalBlock = plans.slice(
    plans.indexOf('key: "professional"'),
    plans.indexOf('key: "business"'),
  );
  assert.match(professionalBlock, /name:\s*"Professional"/);
});

test("unpaid billing overview label is Free", () => {
  const types = readSource("src/lib/billing/types.ts");
  assert.match(
    types,
    /hasPaymentProblem \|\| paymentPending[\s\S]*?:\s*"Free"/,
  );
  assert.doesNotMatch(
    types,
    /hasPaymentProblem \|\| paymentPending[\s\S]*?:\s*"No active subscription"/,
  );
});

test("entitlements fail closed without mapped plan — no starter_default paid grant", () => {
  const resolver = readSource("src/lib/entitlements/resolver.ts");
  assert.match(resolver, /if\s*\(\s*!activeAccess\s*\|\|\s*!mappedPlanKey\s*\)/);
  assert.match(resolver, /planLabel:\s*"Free"/);
  assert.match(resolver, /isPaidAccess:\s*false/);
  assert.match(resolver, /MINIMAL_ENTITLEMENTS/);
  assert.match(resolver, /fallbackPath:\s*"minimal_access"/);
  assert.doesNotMatch(resolver, /fallbackPath\s*=\s*mappedPlanKey\s*\?\s*"paid_plan"\s*:\s*"starter_default"/);
  assert.doesNotMatch(resolver, /mappedPlanKey\s*\?\?\s*getDefaultPlanKey\(\)/);
});

test("effective-plan unpaid fallback uses default key with isPaidAccess false", () => {
  const effective = readSource("src/lib/plans/effective-plan.ts");
  assert.match(effective, /planSource:\s*PlanResolutionSource\s*=\s*"starter_fallback"/);
  assert.match(
    effective,
    /isPaidAccess\s*=\s*[\s\S]*planSource === "plan_override"[\s\S]*mappedPlanKeyFromPriceId !== null/,
  );
  assert.match(effective, /getDefaultPlanKey\(\)/);
});

test("Free feature matrix does not unlock paid Professional capabilities", () => {
  const features = readSource("src/lib/plans/features.ts");
  const starterIdx = features.indexOf("starter: {");
  const professionalIdx = features.indexOf("professional: {");
  assert.ok(starterIdx > 0 && professionalIdx > starterIdx);
  const starterBlock = features.slice(starterIdx, professionalIdx);
  assert.match(starterBlock, /max_clients:\s*5/);
  assert.match(starterBlock, /seats:\s*1/);
  assert.match(starterBlock, /profitability:\s*false/);
  assert.match(starterBlock, /white_label:\s*false/);
  assert.match(starterBlock, /report_templates:\s*false/);
  assert.match(starterBlock, /automation_engine:\s*false/);
  assert.match(starterBlock, /risks:\s*false/);
  assert.match(starterBlock, /incidents:\s*false/);
  assert.match(starterBlock, /ai_report_assistant:\s*false/);
  assert.match(starterBlock, /future_api_webhooks:\s*false/);

  const professionalBlock = features.slice(
    professionalIdx,
    features.indexOf("business: {"),
  );
  assert.match(professionalBlock, /max_clients:\s*25/);
  assert.match(professionalBlock, /seats:\s*3/);
  assert.match(professionalBlock, /profitability:\s*true/);
  assert.match(professionalBlock, /white_label:\s*true/);
});

test("MINIMAL entitlements remain fail-closed for unpaid paid-access checks", () => {
  const definitions = readSource("src/lib/entitlements/definitions.ts");
  assert.match(definitions, /MINIMAL_ENTITLEMENTS[\s\S]*maxClients:\s*0/);
  assert.match(definitions, /MINIMAL_ENTITLEMENTS[\s\S]*maxSeats:\s*1/);
  assert.match(definitions, /dashboard_read/);
  assert.match(definitions, /billing_page/);
  assert.doesNotMatch(
    definitions,
    /MINIMAL_ACCESS_FEATURES[\s\S]*"profitability"/,
  );
  assert.doesNotMatch(definitions, /MINIMAL_ACCESS_FEATURES[\s\S]*"automations"/);
  assert.doesNotMatch(definitions, /MINIMAL_ACCESS_FEATURES[\s\S]*"api"/);
});

test("org registration persists plan free flag (not entitlement source)", () => {
  const auth = readSource("src/lib/auth/actions.ts");
  assert.match(auth, /plan:\s*"free"/);
});

test("plan source label documents Free unpaid baseline", () => {
  const labels = readSource("src/lib/plans/plan-source-labels.ts");
  assert.match(labels, /Free \/ unpaid baseline/);
  assert.doesNotMatch(labels, /Professional fallback limits apply/);
});

test("LIVE charging gate remains independent — checkout unavailable when live gate off", () => {
  const production = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(production, /isMollieLiveChargingEnabled\(\)/);
  assert.match(
    production,
    /if\s*\(\s*mode === "live"\s*\)\s*\{[\s\S]*return isMollieLiveChargingEnabled\(\)/,
  );
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /MOLLIE_LIVE_CHARGING_ENABLED/);
  assert.match(rollout, /Even with a live_ API key/);
});

test("EUR paid prices unchanged Professional 179 / Business 599 / Enterprise 1799", () => {
  const catalog = readSource("src/lib/billing/price-catalog.ts");
  assert.match(catalog, /amountMinor:\s*17_900/);
  assert.match(catalog, /amountMinor:\s*59_900/);
  assert.match(catalog, /amountMinor:\s*179_900/);
});

/**
 * Mollie Phase 4.1 — Billing period repair (upgrade blocker V2).
 * Pure period math + source-contract. Does not enable LIVE charging.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

function normalizeBoundary(value, bound) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return Date.parse(bound === "end" ? `${trimmed}T23:59:59.999Z` : `${trimmed}T00:00:00.000Z`);
  }
  return Date.parse(trimmed);
}

function coerceInstant(value, bound) {
  if (!value || typeof value !== "string" || value.trim().length === 0) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

function isValidPeriod(start, end) {
  if (!start || !end) return false;
  const startMs = normalizeBoundary(start, "start");
  const endMs = normalizeBoundary(end, "end");
  return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
}

/** Mirrors src/lib/billing/providers/mollie/billing-period.ts */
function resolvePeriodUpdate(input) {
  const nextEnd = coerceInstant(input.nextPaymentDate, "end");
  const existingStart = input.existingStart?.trim() ? input.existingStart.trim() : null;
  const existingEnd = input.existingEnd?.trim() ? input.existingEnd.trim() : null;
  const periodEnd = nextEnd ?? existingEnd;
  if (!periodEnd) {
    return { currentPeriodStart: existingStart, currentPeriodEnd: null, advanced: false };
  }
  const endMs = normalizeBoundary(periodEnd, "end");
  const existingEndMs = existingEnd ? normalizeBoundary(existingEnd, "end") : Number.NaN;
  const existingValid = isValidPeriod(existingStart, existingEnd);
  if (
    input.mode === "renewal" &&
    existingValid &&
    Number.isFinite(endMs) &&
    Number.isFinite(existingEndMs) &&
    endMs > existingEndMs
  ) {
    return {
      currentPeriodStart: coerceInstant(existingEnd, "end"),
      currentPeriodEnd: periodEnd,
      advanced: true,
    };
  }
  return {
    currentPeriodStart: existingStart,
    currentPeriodEnd: periodEnd,
    advanced: false,
  };
}

function resolveRepair(input) {
  const periodEnd =
    coerceInstant(input.nextPaymentDate, "end") ?? coerceInstant(input.existingEnd, "end");
  if (!periodEnd) return { repaired: false, reason: "missing_period_end_evidence" };
  if (isValidPeriod(input.existingStart, periodEnd)) {
    return {
      repaired: true,
      currentPeriodStart: coerceInstant(input.existingStart, "start"),
      currentPeriodEnd: periodEnd,
      source: "existing",
    };
  }
  const endMs = normalizeBoundary(periodEnd, "end");
  for (const candidate of input.evidenceStarts ?? []) {
    const start = coerceInstant(candidate, "start");
    if (!start) continue;
    const startMs = normalizeBoundary(start, "start");
    if (Number.isFinite(startMs) && endMs > startMs) {
      return {
        repaired: true,
        currentPeriodStart: start,
        currentPeriodEnd: periodEnd,
        source: "evidence",
      };
    }
  }
  return { repaired: false, reason: "missing_period_start_evidence" };
}

function calculateProration(input) {
  const previousPriceCents = input.previousPriceMonthly * 100;
  const targetPriceCents = input.targetPriceMonthly * 100;
  if (!isValidPeriod(input.currentPeriodStart, input.currentPeriodEnd)) {
    throw new Error("Billing period boundaries are invalid — refusing prorated upgrade.");
  }
  const periodStartMs = normalizeBoundary(input.currentPeriodStart, "start");
  const periodEndMs = normalizeBoundary(input.currentPeriodEnd, "end");
  const remainingMs = Math.max(0, periodEndMs - input.referenceDate.getTime());
  const totalPeriodMs = periodEndMs - periodStartMs;
  const netDueCents = Math.max(
    0,
    Math.round(((targetPriceCents - previousPriceCents) * remainingMs) / totalPeriodMs),
  );
  return { netDueCents, remainingMs, totalPeriodMs };
}

// 1 — Valid Aug22→Sep22 → upgrade proration succeeds
test("1: valid Aug22→Sep22 period allows positive mid-cycle proration", () => {
  const result = calculateProration({
    previousPriceMonthly: 179,
    targetPriceMonthly: 599,
    currentPeriodStart: "2026-08-22T23:36:05.000Z",
    currentPeriodEnd: "2026-09-22T00:00:00.000Z",
    referenceDate: new Date("2026-08-23T10:00:00.000Z"),
  });
  const fullDelta = (599 - 179) * 100;
  assert.ok(result.netDueCents > 0);
  assert.ok(result.netDueCents <= fullDelta);
  assert.ok(result.totalPeriodMs > 0);
});

// 2 — Equal Sep22→Sep22 → upgrade blocked
test("2: equal Sep22→Sep22 period fails closed for upgrade", () => {
  assert.throws(
    () =>
      calculateProration({
        previousPriceMonthly: 179,
        targetPriceMonthly: 599,
        currentPeriodStart: "2026-09-22T00:00:00.000Z",
        currentPeriodEnd: "2026-09-22T00:00:00.000Z",
        referenceDate: new Date("2026-08-23T10:00:00.000Z"),
      }),
    /Billing period boundaries are invalid/,
  );
  const proration = readSource("src/lib/billing/providers/mollie/upgrade-proration.ts");
  assert.match(proration, /Billing period boundaries are invalid/);
  assert.match(proration, /isValidMollieBillingPeriod/);
});

// 3 — Sync with nextPaymentDate Sep22 must NOT convert Aug22→Sep22 into Sep22→Sep22
test("3: sync with unchanged nextPaymentDate preserves valid start", () => {
  const synced = resolvePeriodUpdate({
    existingStart: "2026-08-22T23:36:05.000Z",
    existingEnd: "2026-09-22T00:00:00.000Z",
    nextPaymentDate: "2026-09-22",
    mode: "sync",
  });
  assert.equal(synced.advanced, false);
  assert.equal(synced.currentPeriodStart, "2026-08-22T23:36:05.000Z");
  assert.ok(isValidPeriod(synced.currentPeriodStart, synced.currentPeriodEnd));

  const renewalNoAdvance = resolvePeriodUpdate({
    existingStart: "2026-08-22T23:36:05.000Z",
    existingEnd: "2026-09-22T00:00:00.000Z",
    nextPaymentDate: "2026-09-22",
    mode: "renewal",
  });
  assert.equal(renewalNoAdvance.advanced, false);
  assert.equal(renewalNoAdvance.currentPeriodStart, "2026-08-22T23:36:05.000Z");

  const billingPeriod = readSource("src/lib/billing/providers/mollie/billing-period.ts");
  assert.match(billingPeriod, /never set start = nextPaymentDate/i);
  assert.match(billingPeriod, /mode: "renewal" \| "sync"/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /resolveMollieBillingPeriodUpdate/);
  assert.doesNotMatch(
    webhooks,
    /currentPeriodStart:\s*orgRow\?\.current_period_end\s*\?\?/,
  );
});

// 4 — Recovery + sync preserves valid period
test("4: initial period and recovery paths never use nextPaymentDate as start", () => {
  const billingPeriod = readSource("src/lib/billing/providers/mollie/billing-period.ts");
  assert.match(billingPeriod, /resolveMollieInitialBillingPeriod/);
  assert.match(billingPeriod, /Never start = nextPaymentDate/i);
  const production = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(production, /resolveMollieInitialBillingPeriod/);
  assert.match(production, /subscription\.startDate|subscription\.createdAt/);
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /isValidMollieBillingPeriod/);
  assert.match(upgrade, /resolveMollieBillingPeriodRepair/);
  assert.doesNotMatch(upgrade, /endMs - 30 \* 24 \* 60 \* 60 \* 1000/);
});

// 5 — Successful renewal advances period once
test("5: successful renewal advances period once; duplicate is idempotent", () => {
  const first = resolvePeriodUpdate({
    existingStart: "2026-08-22T23:36:05.000Z",
    existingEnd: "2026-09-22T00:00:00.000Z",
    nextPaymentDate: "2026-10-22",
    mode: "renewal",
  });
  assert.equal(first.advanced, true);
  assert.equal(first.currentPeriodStart, "2026-09-22T00:00:00.000Z");
  assert.equal(first.currentPeriodEnd, "2026-10-22T00:00:00.000Z");

  const duplicate = resolvePeriodUpdate({
    existingStart: first.currentPeriodStart,
    existingEnd: first.currentPeriodEnd,
    nextPaymentDate: "2026-10-22",
    mode: "renewal",
  });
  assert.equal(duplicate.advanced, false);
  assert.equal(duplicate.currentPeriodStart, first.currentPeriodStart);
  assert.equal(duplicate.currentPeriodEnd, first.currentPeriodEnd);
});

// 6 — Duplicate webhook idempotent (source contract)
test("6: webhook uses shared period resolver and idempotency ledger", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /resolveMollieBillingPeriodUpdate/);
  assert.match(webhooks, /ensureMollieIdempotency|mollie_webhook_events/);
  assert.match(webhooks, /mode: paymentKind === "renewal" \? "renewal" : "sync"/);
});

// 7 — Failed Business upgrade leaves Professional
test("7: failed Business upgrade leaves Professional", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /upgrade_payment_failed/);
  assert.match(webhooks, /clearMollieUpgradePaymentAttempt\(organizationId\)/);
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.doesNotMatch(upgrade, /planKey:\s*input\.targetPlanKey/);
});

// 8 — Successful upgrade no second subscription
test("8: successful upgrade updates same sub_ only", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /applyMollieUpgradeAfterPayment/);
  assert.match(lifecycle, /customerSubscriptions\.update/);
  assert.match(lifecycle, /resolveMollieBillingPeriodUpdate/);
  assert.doesNotMatch(lifecycle, /customerSubscriptions\.create/);
});

// 9 — Proration positive and <= full delta mid-cycle
test("9: proration positive and <= full Pro→Business delta mid-cycle", () => {
  const fullDelta = (599 - 179) * 100;
  const mid = calculateProration({
    previousPriceMonthly: 179,
    targetPriceMonthly: 599,
    currentPeriodStart: "2026-08-22T00:00:00.000Z",
    currentPeriodEnd: "2026-09-22T00:00:00.000Z",
    referenceDate: new Date("2026-09-06T12:00:00.000Z"),
  });
  assert.ok(mid.netDueCents > 0);
  assert.ok(mid.netDueCents <= fullDelta);
  assert.ok(mid.netDueCents < fullDelta);
});

// 10 — Timezone handling doesn't collapse period
test("10: date-only nextPaymentDate does not collapse Aug22 start", () => {
  const synced = resolvePeriodUpdate({
    existingStart: "2026-08-22T23:36:05.123Z",
    existingEnd: "2026-09-22T00:00:00.000Z",
    nextPaymentDate: "2026-09-22",
    mode: "sync",
  });
  assert.ok(isValidPeriod(synced.currentPeriodStart, synced.currentPeriodEnd));
  assert.notEqual(synced.currentPeriodStart, synced.currentPeriodEnd);

  const repair = resolveRepair({
    existingStart: "2026-09-22T00:00:00.000Z",
    existingEnd: "2026-09-22T00:00:00.000Z",
    nextPaymentDate: "2026-09-22",
    evidenceStarts: ["2026-08-22T23:36:05.000Z", "2026-09-22T00:00:00.000Z"],
  });
  assert.equal(repair.repaired, true);
  assert.equal(repair.currentPeriodStart, "2026-08-22T23:36:05.000Z");
  assert.ok(isValidPeriod(repair.currentPeriodStart, repair.currentPeriodEnd));
});

test("11: operator repair-billing-period action is wired", () => {
  const route = readSource("src/app/api/operator/mollie/paid-purchase-recovery/route.ts");
  assert.match(route, /repair-billing-period/);
  assert.match(route, /repairMollieOrganizationBillingPeriod/);
  assert.ok(pathExists("src/lib/billing/providers/mollie/billing-period-repair.ts"));
  const repair = readSource("src/lib/billing/providers/mollie/billing-period-repair.ts");
  assert.match(repair, /Does not create payments/);
  assert.match(repair, /resolveMollieBillingPeriodRepair/);
});

test("12: docs and package script present; no LIVE enablement", () => {
  assert.ok(pathExists("docs/mollie-phase-4-1-billing-period-repair.md"));
  const doc = readSource("docs/mollie-phase-4-1-billing-period-repair.md");
  assert.match(doc, /ROOT CAUSE|Writer matrix|Verdict/i);
  const pkg = readSource("package.json");
  assert.match(pkg, /mollie-billing-phase4-1-billing-period-repair\.test\.mjs/);
  const env = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(env, /MOLLIE_LIVE_CHARGING_ENABLED/);
  assert.doesNotMatch(
    readSource("src/lib/billing/providers/mollie/billing-period.ts"),
    /MOLLIE_LIVE_CHARGING_ENABLED\s*=\s*true/,
  );
});

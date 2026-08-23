/**
 * Mollie Phase 4.1 — outbound Idempotency-Key length / uniqueness fix.
 * Mirrors src/lib/billing/providers/mollie/idempotency-key.ts for pure assertions.
 * Does not call Mollie API or enable LIVE charging.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

const MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH = 100;

/** Mirrors buildMollieIdempotencyKey */
function buildMollieIdempotencyKey(input) {
  const organizationId = input.organizationId.trim();
  const operation = input.operation.trim();
  const attemptId = input.attemptId.trim();
  if (!organizationId || !operation || !attemptId) {
    throw new Error("Mollie idempotency key requires organizationId, operation, and attemptId");
  }
  const envTag = input.surface === "prod" ? "p" : "t";
  const material = [input.surface, organizationId, operation, attemptId].join("\0");
  const digest = createHash("sha256").update(material, "utf8").digest("hex");
  const key = `m:${envTag}:${digest}`;
  if (key.length > MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new Error(
      `Mollie idempotency key length ${key.length} exceeds ${MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH}`,
    );
  }
  return key;
}

const ORG_A = "df827f64-84b7-42e1-91a7-9420febcf843";
const ORG_B = "11111111-2222-3333-4444-555555555555";
const ATTEMPT_A = "a542f693-daa6-457f-b478-af47a0a152f6";
const ATTEMPT_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

const LEGACY_FAILED_KEY =
  "mollie:prod:df827f64-84b7-42e1-91a7-9420febcf843:upgrade_adjustment:a542f693-daa6-457f-b478-af47a0a152f6";

test("A: generated keys are always <= 100 characters", () => {
  const key = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "upgrade_adjustment",
    attemptId: ATTEMPT_A,
  });
  assert.ok(key.length <= MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH);
  assert.equal(key.length, 68);
  assert.equal(LEGACY_FAILED_KEY.length, 104);
  assert.ok(LEGACY_FAILED_KEY.length > MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH);
});

test("B: same logical operation => same key", () => {
  const a = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "upgrade_adjustment",
    attemptId: ATTEMPT_A,
  });
  const b = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "upgrade_adjustment",
    attemptId: ATTEMPT_A,
  });
  assert.equal(a, b);
});

test("C: different attempt => different key", () => {
  const a = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "upgrade_adjustment",
    attemptId: ATTEMPT_A,
  });
  const b = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "upgrade_adjustment",
    attemptId: ATTEMPT_B,
  });
  assert.notEqual(a, b);
});

test("D: different org => different key", () => {
  const a = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "upgrade_adjustment",
    attemptId: ATTEMPT_A,
  });
  const b = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_B,
    operation: "upgrade_adjustment",
    attemptId: ATTEMPT_A,
  });
  assert.notEqual(a, b);
});

test("E: operation namespaces do not collide", () => {
  const upgrade = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "upgrade_adjustment",
    attemptId: ATTEMPT_A,
  });
  const first = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "first_payment",
    attemptId: ATTEMPT_A,
  });
  const sub = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "subscription",
    attemptId: ATTEMPT_A,
  });
  assert.notEqual(upgrade, first);
  assert.notEqual(upgrade, sub);
  assert.notEqual(first, sub);
});

test("F: TEST vs prod surface env tags differ", () => {
  const prod = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: ORG_A,
    operation: "first_payment",
    attemptId: ATTEMPT_A,
  });
  const testSurface = buildMollieIdempotencyKey({
    surface: "test",
    organizationId: ORG_A,
    operation: "first_payment",
    attemptId: ATTEMPT_A,
  });
  assert.match(prod, /^m:p:[0-9a-f]{64}$/);
  assert.match(testSurface, /^m:t:[0-9a-f]{64}$/);
  assert.notEqual(prod, testSurface);
});

test("G: long inputs cannot produce oversized keys", () => {
  const longOrg = `${ORG_A}${"x".repeat(500)}`;
  const longOp = `upgrade_adjustment${"y".repeat(500)}`;
  const longAttempt = `${ATTEMPT_A}${"z".repeat(500)}`;
  const key = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: longOrg,
    operation: longOp,
    attemptId: longAttempt,
  });
  assert.ok(key.length <= MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH);
  assert.equal(key.length, 68);
});

test("H: payment creation paths send buildMollieIdempotencyKey", () => {
  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /buildMollieIdempotencyKey/);
  assert.match(upgrade, /operation:\s*"upgrade_adjustment"/);
  assert.match(upgrade, /idempotencyKey:\s*buildMollieIdempotencyKey/);
  assert.doesNotMatch(upgrade, /mollie:prod:\$\{/);
  assert.doesNotMatch(upgrade, /\.slice\(0,\s*255\)/);

  const prod = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(prod, /buildMollieIdempotencyKey/);
  assert.match(prod, /operation:\s*"first_payment"/);
  assert.match(prod, /operation:\s*"subscription"/);

  const testCheckout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(testCheckout, /buildMollieIdempotencyKey/);
  assert.match(testCheckout, /surface:\s*"test"/);
});

test("I: upgrade initiation no longer uses unbounded concatenation", () => {
  const helper = readSource("src/lib/billing/providers/mollie/idempotency-key.ts");
  assert.match(helper, /MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH\s*=\s*100/);
  assert.match(helper, /createHash\("sha256"\)/);
  assert.match(helper, /buildMollieIdempotencyKey/);
  assert.match(helper, /m:\$\{envTag\}:\$\{digest\}/);

  const upgrade = readSource("src/lib/billing/providers/mollie/upgrade-payment.ts");
  assert.match(upgrade, /from "@\/lib\/billing\/providers\/mollie\/idempotency-key"/);
  assert.doesNotMatch(
    upgrade,
    /function buildIdempotencyKey\(organizationId: string, operation: string, attemptId: string\)/,
  );
});

test("J: recovery / cancellation / payment contracts still wired", () => {
  assert.ok(pathExists("src/lib/billing/providers/mollie/paid-purchase-recovery.ts"));
  assert.ok(pathExists("src/lib/billing/providers/mollie/upgrade-payment.ts"));
  assert.ok(pathExists("src/lib/billing/providers/mollie/webhooks.ts"));
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /applyMollieUpgradeAfterPayment/);
  const classification = readSource("src/lib/billing/providers/mollie/payment-classification.ts");
  assert.match(classification, /upgrade_adjustment/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /ensureMollieIdempotency/);
});

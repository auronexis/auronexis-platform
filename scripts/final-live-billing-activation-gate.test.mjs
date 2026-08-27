/**
 * Final LIVE billing activation gate — behavioral matrix A–Z.
 * Export resolution is regex-based to tolerate minor identifier churn.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/final-live-billing-activation-gate.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

function resolveExport(mod, label, patterns) {
  const keys = Object.keys(mod);
  for (const pattern of patterns) {
    const re = typeof pattern === "string" ? new RegExp(`^${pattern}$`) : pattern;
    const key = keys.find((k) => re.test(k));
    if (key !== undefined) return mod[key];
  }
  throw new Error(`[${label}] missing export matching ${patterns} (have: ${keys.join(", ")})`);
}

const tax = await import("../src/lib/billing/tax-policy.ts");
const taxes = await import("../src/lib/billing/taxes.ts");
const legendMod = await import("../src/lib/billing/reverse-charge-legend.ts");
const price = await import("../src/lib/billing/price-catalog.ts");
const plans = await import("../src/lib/billing/plans.ts");
const mode = await import("../src/lib/billing/providers/mollie/mode.ts");
const rollout = await import("../src/lib/billing/providers/mollie/rollout.ts");
const life = await import("../src/lib/billing/providers/mollie/lifecycle-status.ts");
const idemp = await import("../src/lib/billing/providers/mollie/idempotency-key.ts");
const webhooks = await import("../src/lib/billing/providers/mollie/webhooks.ts");
const einv = await import("../src/lib/billing/e-invoice.ts");
const invoice = await import("../src/lib/billing/sales-invoice.ts");
const provider = await import("../src/lib/billing/provider.ts");
const proration = await import("../src/lib/billing/providers/mollie/upgrade-proration.ts");

const determineTaxPolicy = resolveExport(tax, "tax.determine", [/determine.*Tax.*Policy/i]);
const taxOutcomeAllowsSelfServeCheckout = resolveExport(tax, "tax.allows", [
  /taxOutcomeAllowsSelfServe/i,
]);
const DE_STANDARD_VAT_RATE_BPS = resolveExport(tax, "tax.rate", [/DE_.*VAT.*BPS/i]);
const LEGAL_TEXT_PENDING_COUNSEL = resolveExport(tax, "tax.legend", [
  /LEGAL_TEXT_PENDING_COUNSEL/i,
]);

const calculateVatInclusiveBreakdown = resolveExport(taxes, "taxes.breakdown", [
  /calculateVatInclusiveBreakdown/i,
]);
const splitVatInclusiveGross = resolveExport(taxes, "taxes.split", [/splitVatInclusiveGross/i]);
const resolveReverseChargeLegend = resolveExport(legendMod, "legend", [
  /resolveReverseChargeLegend/i,
]);

const getActiveCatalogPrice = resolveExport(price, "price.get", [/getActiveCatalogPrice/i]);
const PRIMARY_BILLING_CURRENCY = resolveExport(price, "price.currency", [
  /PRIMARY_BILLING_CURRENCY/i,
]);
const formatMinorUnitsForMollie = resolveExport(price, "price.format", [
  /formatMinorUnitsForMollie/i,
]);
const assertPriceConsistency = resolveExport(price, "price.assert", [/assertPriceConsistency/i]);
const EUR_PRICE_CATALOG = resolveExport(price, "price.catalog", [/EUR_PRICE_CATALOG/i]);

const getPlanByKey = resolveExport(plans, "plans.get", [/^getPlanByKey$/i]);

const resolveMollieApiModeFromKey = resolveExport(mode, "mode.resolve", [
  /resolveMollieApiModeFromKey/i,
]);
const assertMolliePaymentOpsAllowed = resolveExport(mode, "mode.assert", [
  /assertMolliePaymentOpsAllowed/i,
]);
const isMollieLiveChargingEnabled = resolveExport(rollout, "rollout.live", [
  /isMollieLiveChargingEnabled/i,
]);

const isMolliePaymentPaid = resolveExport(life, "life.paid", [/isMolliePaymentPaid/i]);
const isMolliePaymentPending = resolveExport(life, "life.pending", [/isMolliePaymentPending/i]);
const isMolliePaymentTerminalFailure = resolveExport(life, "life.terminal", [
  /isMolliePaymentTerminalFailure/i,
]);
const mapMollieSubscriptionStatus = resolveExport(life, "life.map", [
  /mapMollieSubscriptionStatus/i,
]);
const isMollieSubscriptionEntitlementGranting = resolveExport(life, "life.grant", [
  /isMollieSubscriptionEntitlementGranting/i,
]);
const resolveMollieStoredSubscriptionStatus = resolveExport(life, "life.stored", [
  /resolveMollieStoredSubscriptionStatus/i,
]);

const buildMollieIdempotencyKey = resolveExport(idemp, "idemp", [/buildMollieIdempotencyKey/i]);
const extractMollieWebhookPaymentId = resolveExport(webhooks, "wh.extract", [
  /extractMollieWebhookPaymentId/i,
]);

const getEInvoiceCapabilityReport = resolveExport(einv, "einv.report", [
  /getEInvoiceCapabilityReport/i,
]);
const tryGenerateEInvoiceXml = resolveExport(einv, "einv.xml", [/tryGenerateEInvoiceXml/i]);
const SALES_INVOICE_CREDIT_NOTE_STATUS = resolveExport(invoice, "invoice.credit", [
  /SALES_INVOICE_CREDIT_NOTE_STATUS/i,
]);
const getActiveBillingProvider = resolveExport(provider, "provider", [
  /getActiveBillingProvider/i,
]);
const calculateMollieUpgradeProration = resolveExport(proration, "proration", [
  /calculateMollieUpgradeProration/i,
]);

function taxInput(overrides = {}) {
  return {
    customerCountryCode: "DE",
    vatId: null,
    viesStatus: "not_checked",
    isB2bEntrepreneurConfirmed: true,
    ...overrides,
  };
}

function prop(obj, ...names) {
  for (const name of names) {
    if (obj && obj[name] !== undefined) return obj[name];
  }
  return undefined;
}

test("A: DE B2B successful tax classification", () => {
  const result = determineTaxPolicy(taxInput());
  assert.equal(result.outcome, "STANDARD_DOMESTIC_VAT");
  assert.equal(prop(result, "vatRateBps", "vatRateBps"), DE_STANDARD_VAT_RATE_BPS);
  assert.equal(prop(result, "blocksCheckout", "blocksCheckout"), false);
  assert.equal(taxOutcomeAllowsSelfServeCheckout(result.outcome), true);
  const breakdown = calculateVatInclusiveBreakdown({
    grossMinor: 17_900,
    determination: result,
  });
  assert.equal(breakdown.grossMinor, 17_900);
  assert.equal(
    prop(breakdown, "netMinor", "netMinor") + prop(breakdown, "vatMinor", "vatMinor"),
    breakdown.grossMinor,
  );
});

test("B: EU B2B valid VAT/VIES → Reverse Charge but self-serve blocked", () => {
  const result = determineTaxPolicy(
    taxInput({ customerCountryCode: "FR", vatId: "FR12345678901", viesStatus: "valid" }),
  );
  assert.equal(result.outcome, "REVERSE_CHARGE");
  assert.equal(prop(result, "blocksCheckout", "blocksCheckout"), true);
  assert.equal(
    prop(result, "reverseChargeLegendStatus", "reverseChargeLegendStatus"),
    LEGAL_TEXT_PENDING_COUNSEL,
  );
  assert.equal(taxOutcomeAllowsSelfServeCheckout(result.outcome), false);
});

test("C: EU invalid VAT fails closed", () => {
  const result = determineTaxPolicy(
    taxInput({ customerCountryCode: "NL", vatId: "NL123", viesStatus: "invalid" }),
  );
  assert.equal(result.outcome, "UNKNOWN_BLOCK_CHECKOUT");
  assert.equal(prop(result, "blocksCheckout", "blocksCheckout"), true);
});

test("D: VIES unavailable fails closed", () => {
  for (const viesStatus of ["unavailable", "not_checked", "skipped"]) {
    const result = determineTaxPolicy(
      taxInput({ customerCountryCode: "AT", vatId: "ATU12345678", viesStatus }),
    );
    assert.equal(result.outcome, "UNKNOWN_BLOCK_CHECKOUT");
    assert.equal(prop(result, "blocksCheckout", "blocksCheckout"), true);
  }
});

test("E: non-EU unsupported / manual review", () => {
  const result = determineTaxPolicy(taxInput({ customerCountryCode: "US" }));
  assert.equal(result.outcome, "MANUAL_REVIEW");
  assert.equal(prop(result, "blocksCheckout", "blocksCheckout"), true);
  assert.equal(taxOutcomeAllowsSelfServeCheckout(result.outcome), false);
  assert.throws(() =>
    calculateVatInclusiveBreakdown({ grossMinor: 17_900, determination: result }),
  );
});

test("F: B2B acknowledgement omitted blocks checkout", () => {
  const result = determineTaxPolicy(taxInput({ isB2bEntrepreneurConfirmed: false }));
  assert.equal(result.outcome, "UNKNOWN_BLOCK_CHECKOUT");
  assert.equal(prop(result, "blocksCheckout", "blocksCheckout"), true);
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /b2bEntrepreneurConfirmed/);
  assert.match(actions, /checkoutContractSchema/);
  assert.match(actions, /createCheckoutSessionAction/);
});

test("G: organization spoof attempt — checkout uses session org only", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /requireSession\s*\(/);
  assert.match(actions, /session\.organization\.id/);
  assert.match(actions, /export async function createCheckoutSessionAction\(/);
  assert.match(readSource("src/lib/billing/providers/mollie/webhooks.ts"), /mismatch/);
});

test("H: plan spoof attempt — only server catalog plans", () => {
  assert.equal(getPlanByKey("professional").amountMinor, 17_900);
  assert.equal(getPlanByKey("business").amountMinor, 59_900);
  assert.throws(() => getPlanByKey("not-a-plan"));
  assert.match(readSource("src/lib/billing/actions.ts"), /planKeySchema/);
});

test("I: price spoof attempt — catalog is authoritative", () => {
  const pro = getActiveCatalogPrice({ planKey: "professional" });
  assert.ok(pro);
  assert.equal(pro.amountMinor, 17_900);
  assert.equal(
    assertPriceConsistency({
      catalogAmountMinor: 17_900,
      checkoutAmountMinor: 17_900,
      chargedAmountMinor: 17_900,
      invoiceGrossMinor: 17_900,
    }),
    true,
  );
  assert.equal(
    assertPriceConsistency({
      catalogAmountMinor: 17_900,
      checkoutAmountMinor: 1,
      chargedAmountMinor: 17_900,
      invoiceGrossMinor: 17_900,
    }),
    false,
  );
});

test("J: currency spoof attempt — EUR only in production catalog", () => {
  assert.equal(PRIMARY_BILLING_CURRENCY, "EUR");
  assert.equal(getActiveCatalogPrice({ planKey: "professional", currency: "USD" }), null);
  assert.match(String(formatMinorUnitsForMollie(17_900)), /^179\.00$/);
  for (const entry of EUR_PRICE_CATALOG) assert.equal(entry.currency, "EUR");
  assert.equal(getPlanByKey("professional").currency, "EUR");
});

test("K: charging gate false by default", () => {
  const previous = process.env.MOLLIE_LIVE_CHARGING_ENABLED;
  delete process.env.MOLLIE_LIVE_CHARGING_ENABLED;
  try {
    assert.equal(isMollieLiveChargingEnabled(), false);
  } finally {
    if (previous === undefined) delete process.env.MOLLIE_LIVE_CHARGING_ENABLED;
    else process.env.MOLLIE_LIVE_CHARGING_ENABLED = previous;
  }
  assert.match(readSource(".env.example"), /MOLLIE_LIVE_CHARGING_ENABLED=false/);
});

test("L: charging gate parser edge cases fail closed", () => {
  const previous = process.env.MOLLIE_LIVE_CHARGING_ENABLED;
  const previousKey = process.env.MOLLIE_API_KEY;
  try {
    for (const raw of ["false", "0", "no", "off", "yesplease", "tru", "maybe"]) {
      process.env.MOLLIE_LIVE_CHARGING_ENABLED = raw;
      assert.equal(isMollieLiveChargingEnabled(), false, raw);
    }
    for (const raw of ["true", "1", "YES", "ON"]) {
      process.env.MOLLIE_LIVE_CHARGING_ENABLED = raw;
      assert.equal(isMollieLiveChargingEnabled(), true, raw);
    }
    process.env.MOLLIE_API_KEY = "live_example";
    process.env.MOLLIE_LIVE_CHARGING_ENABLED = "false";
    assert.throws(() => assertMolliePaymentOpsAllowed());
    process.env.MOLLIE_LIVE_CHARGING_ENABLED = "true";
    assert.equal(assertMolliePaymentOpsAllowed(), "live");
    process.env.MOLLIE_API_KEY = "test_example";
    process.env.MOLLIE_LIVE_CHARGING_ENABLED = "false";
    assert.equal(assertMolliePaymentOpsAllowed(), "test");
  } finally {
    if (previous === undefined) delete process.env.MOLLIE_LIVE_CHARGING_ENABLED;
    else process.env.MOLLIE_LIVE_CHARGING_ENABLED = previous;
    if (previousKey === undefined) delete process.env.MOLLIE_API_KEY;
    else process.env.MOLLIE_API_KEY = previousKey;
  }
  assert.equal(resolveMollieApiModeFromKey("test_abc"), "test");
  assert.equal(resolveMollieApiModeFromKey("live_abc"), "live");
  assert.equal(resolveMollieApiModeFromKey("pk_live"), null);
});

test("M: paid Mollie payment status", () => {
  assert.equal(isMolliePaymentPaid("paid"), true);
  assert.equal(isMolliePaymentPaid("open"), false);
});

test("N: pending payment status", () => {
  assert.equal(isMolliePaymentPending("open"), true);
  assert.equal(isMolliePaymentPending("pending"), true);
  assert.equal(isMolliePaymentPending("paid"), false);
});

test("O: failed payment status", () => {
  assert.equal(isMolliePaymentTerminalFailure("failed"), true);
});

test("P: expired payment status", () => {
  assert.equal(isMolliePaymentTerminalFailure("expired"), true);
});

test("Q: canceled payment status", () => {
  assert.equal(isMolliePaymentTerminalFailure("canceled"), true);
});

test("R: duplicate webhook / idempotency key behavior", () => {
  const key1 = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: "org-1",
    operation: "first_payment",
    attemptId: "att-1",
  });
  const key2 = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: "org-1",
    operation: "first_payment",
    attemptId: "att-1",
  });
  const keyOther = buildMollieIdempotencyKey({
    surface: "prod",
    organizationId: "org-2",
    operation: "first_payment",
    attemptId: "att-1",
  });
  assert.equal(key1, key2);
  assert.notEqual(key1, keyOther);
  assert.ok(key1.length <= 100);
  assert.equal(extractMollieWebhookPaymentId("id=tr_abc123"), "tr_abc123");
  assert.equal(extractMollieWebhookPaymentId('{"id":"tr_json"}'), "tr_json");
  assert.equal(extractMollieWebhookPaymentId("{}"), null);
  const webhookRoute = readSource("src/app/api/mollie/webhook/route.ts");
  assert.match(webhookRoute, /ensureMollieIdempotency/);
  assert.match(webhookRoute, /duplicate/);
  assert.match(webhookRoute, /reconcileMolliePaymentWebhook/);
});

test("S: return / webhook race — return is non-authoritative", () => {
  assert.match(
    readSource("src/lib/billing/providers/mollie/return-state.ts"),
    /non-authoritative|Never grants entitlements/i,
  );
  const returnPage = readSource(
    "src/app/(dashboard)/settings/billing/mollie/return/page.tsx",
  );
  assert.match(returnPage, /not trusted|authoritative payment/i);
  assert.doesNotMatch(returnPage, /resolveOrganizationEntitlements\s*\(/);
  assert.match(readSource("src/lib/billing/providers/mollie/webhooks.ts"), /payments\.get/);
});

test("T: paid → subscription creation failure recovery path exists", () => {
  assert.ok(pathExists("src/lib/billing/providers/mollie/paid-purchase-recovery.ts"));
  assert.match(
    readSource("src/lib/billing/providers/mollie/paid-purchase-recovery.ts"),
    /recoverMolliePaidFreshPurchase/,
  );
  assert.ok(pathExists("src/app/api/operator/mollie/paid-purchase-recovery/route.ts"));
  const route = readSource("src/app/api/operator/mollie/paid-purchase-recovery/route.ts");
  assert.match(route, /verifyCronAuthorization|CRON_SECRET/);
  assert.match(route, /isMollieLiveChargingEnabled|MOLLIE_LIVE_CHARGING_ENABLED/);
});

test("U: invoice issuance wiring (domestic paid path)", () => {
  const invoiceFromMollie = readSource("src/lib/billing/sales-invoice-from-mollie.ts");
  assert.match(invoiceFromMollie, /maybeIssueSalesInvoiceForPaidMolliePayment/);
  assert.match(invoiceFromMollie, /STANDARD_DOMESTIC_VAT/);
  assert.match(readSource("src/lib/billing/sales-invoice.ts"), /issueSalesInvoice|allocate/i);
});

test("V: duplicate invoice prevention", () => {
  assert.match(
    readSource("supabase/migrations/20250824100000_p1_002_pricing_tax_invoice_contracting.sql"),
    /provider_transaction_id|sales_invoices/,
  );
  assert.match(
    readSource("src/lib/billing/sales-invoice-from-mollie.ts"),
    /provider_transaction_id|already|existing|duplicate/i,
  );
});

test("W: invoice snapshot immutability + RC legend gate", () => {
  assert.ok(
    pathExists("supabase/migrations/20250826100000_sales_invoice_tax_evidence_snapshots.sql"),
  );
  assert.match(
    readSource("supabase/migrations/20250826100000_sales_invoice_tax_evidence_snapshots.sql"),
    /seller_snapshot|tax_decision_evidence|tax_evidence/i,
  );
  const legend = resolveReverseChargeLegend({
    taxPolicyOutcome: "REVERSE_CHARGE",
    reverseChargeLegendStatus: LEGAL_TEXT_PENDING_COUNSEL,
  });
  assert.equal(prop(legend, "showOnInvoice", "showOnInvoice"), false);
  assert.equal(prop(legend, "legendText", "legendText"), null);
});

test("X: pilot access isolation", () => {
  assert.match(
    readSource("src/lib/billing/providers/mollie/checkout.ts"),
    /MOLLIE_SELF_SERVE_PLAN_KEYS/,
  );
  assert.doesNotMatch(
    readSource("src/lib/billing/providers/mollie/checkout.ts"),
    /["']pilot["']/,
  );
  assert.match(
    readSource("src/lib/billing/providers/mollie/foundation.ts"),
    /never grants entitlements|TEST/i,
  );
  assert.match(
    readSource("src/lib/entitlements/resolver.ts"),
    /getPlanOverride|MINIMAL_ENTITLEMENTS/,
  );
});

test("Y: cancellation paid-through semantics", () => {
  assert.equal(
    resolveMollieStoredSubscriptionStatus({
      providerStatus: "active",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
    }),
    "active",
  );
  assert.equal(
    resolveMollieStoredSubscriptionStatus({
      providerStatus: "active",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() - 86400000).toISOString(),
    }),
    "canceled",
  );
  assert.match(
    readSource("src/lib/billing/providers/mollie/lifecycle.ts"),
    /cancelMollieOrganizationSubscription/,
  );
});

test("Z: entitlement enforcement — Mollie not authority; sole provider", () => {
  assert.equal(getActiveBillingProvider(), "mollie");
  assert.equal(isMollieSubscriptionEntitlementGranting("active"), true);
  assert.equal(isMollieSubscriptionEntitlementGranting("suspended"), false);
  assert.equal(isMollieSubscriptionEntitlementGranting("canceled"), false);
  assert.equal(mapMollieSubscriptionStatus("pending"), "incomplete");
  assert.match(
    readSource("src/lib/entitlements/resolver.ts"),
    /resolveOrganizationEntitlements/,
  );
  assert.doesNotMatch(readSource("src/lib/entitlements/resolver.ts"), /payments\.get\(/);

  assert.equal(prop(SALES_INVOICE_CREDIT_NOTE_STATUS, "supported", "supported"), false);
  const eInvoice = getEInvoiceCapabilityReport();
  assert.equal(prop(eInvoice, "xmlGenerationEnabled", "xmlGenerationEnabled"), false);
  assert.match(String(tryGenerateEInvoiceXml({}).code), /GENERATOR_DEFERRED/i);

  const upgrade = calculateMollieUpgradeProration({
    previousPlanKey: "professional",
    targetPlanKey: "business",
    currentPeriodStart: "2026-08-01T00:00:00.000Z",
    currentPeriodEnd: "2026-09-01T00:00:00.000Z",
    referenceDate: new Date("2026-08-16T00:00:00.000Z"),
  });
  assert.equal(upgrade.currency, "EUR");
  assert.ok(prop(upgrade, "netDueCents", "netDueCents") > 0);

  const split = splitVatInclusiveGross({ grossMinor: 17_900, vatRateBps: 1900 });
  assert.equal(prop(split, "netMinor", "netMinor") + prop(split, "vatMinor", "vatMinor"), 17_900);
});

test("legacy active providers remain zero", () => {
  assert.equal(getActiveBillingProvider(), "mollie");
  assert.ok(pathExists("src/app/api/fastspring/webhook/route.ts"));
  assert.match(readSource("src/app/api/fastspring/webhook/route.ts"), /410/);
  assert.equal(pathExists("src/app/api/stripe"), false);
  assert.equal(pathExists("src/app/api/paddle"), false);
});

test("required migrations present for LIVE gate manifest", () => {
  for (const file of [
    "supabase/migrations/20250820000000_mollie_test_subscription_lifecycle.sql",
    "supabase/migrations/20250822010000_mollie_pending_plan_change.sql",
    "supabase/migrations/20250822020000_mollie_upgrade_payment_attempt.sql",
    "supabase/migrations/20250824100000_p1_002_pricing_tax_invoice_contracting.sql",
    "supabase/migrations/20250826100000_sales_invoice_tax_evidence_snapshots.sql",
  ]) {
    assert.ok(pathExists(file), `missing ${file}`);
  }
});

test("per-resource Mollie webhookUrl on production checkout and subscription", () => {
  const production = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(production, /function buildMollieWebhookUrl\(\):\s*string/);
  assert.match(production, /\$\{getAppUrl\(\)\}\/api\/mollie\/webhook/);
  assert.match(production, /customerPayments\.create\([\s\S]*webhookUrl:\s*buildMollieWebhookUrl\(\)/);
  assert.match(
    production,
    /customerSubscriptions\.create\([\s\S]*webhookUrl:\s*buildMollieWebhookUrl\(\)/,
  );
});

test("dashboard webhook registration is not a LIVE go-live readiness condition", () => {
  const gate = readSource("docs/final-live-billing-activation-gate.md");
  assert.match(gate, /Dashboard webhook \*\*not\*\* required|Dashboard webhook \*\*not\*\* a blocker/i);
  assert.doesNotMatch(gate, /classic webhook registered/);

  const checklist = readSource("docs/enterprise-release-checklist.md");
  assert.match(checklist, /DASHBOARD_WEBHOOK_REQUIRED = NO/);
  assert.doesNotMatch(
    checklist,
    /registered in the Mollie dashboard \(classic payment notifications\)/i,
  );

  const closeout = readSource("docs/production-operator-technical-closeout.md");
  assert.match(closeout, /DASHBOARD_WEBHOOK_REQUIRED = NO/);
  assert.match(closeout, /Dashboard webhook registration:\*\* \*\*NOT REQUIRED/i);
  assert.doesNotMatch(
    closeout,
    /\|\s*3\s*\|\s*Mollie Dashboard → Webhooks\s*\|\s*Classic payment webhook registered/i,
  );
});

test("production webhook host resolves to app.auroranexis.com", () => {
  for (const relative of [
    "docs/domain-setup.md",
    "docs/enterprise-deployment.md",
    "docs/enterprise-production-golive-playbook.md",
    "docs/production-operator-technical-closeout.md",
    "docs/final-live-billing-activation-gate.md",
  ]) {
    const src = readSource(relative);
    assert.match(
      src,
      /https:\/\/app\.auroranexis\.com/,
      `${relative} must cite app.auroranexis.com`,
    );
    assert.doesNotMatch(
      src,
      /www\.auroranexis\.com\/api\/mollie\/webhook/,
      `${relative} must not cite www Mollie webhook URL`,
    );
  }

  const env = readSource("src/lib/env.ts");
  assert.match(env, /export function getAppUrl/);
  assert.match(env, /NEXT_PUBLIC_APP_URL/);
});

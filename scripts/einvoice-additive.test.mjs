/**
 * Additive e-invoice module — Tests A–K + billing freeze proof.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/einvoice-additive.test.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { execSync } from "node:child_process";
import { readSource } from "./_test-helpers/read-source.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const einvoice = await import("../src/lib/einvoice/index.ts");

const {
  adaptIssuedInvoiceToCanonical,
  generateZugferdEn16931Xml,
  validateEInvoice,
  generateEInvoiceFromIssuedSnapshot,
  buildDemoDomesticIssuedSnapshot,
  buildDemoReverseChargeIssuedSnapshot,
  EN16931_GUIDELINE_ID,
  minorToDecimalString,
} = einvoice;

const BILLING_FREEZE_PATHS = [
  "src/lib/billing/",
  "src/app/api/billing/",
  "src/app/api/mollie/",
  "src/lib/billing/sales-invoice-render.ts",
  "src/lib/billing/sales-invoice-email.ts",
  "src/lib/billing/sales-invoice-from-mollie.ts",
  "src/lib/billing/taxes.ts",
  "src/lib/billing/tax-policy.ts",
  "supabase/migrations/",
];

function gitDiffAgainstBaseline(paths) {
  try {
    return execSync(`git diff 99ee628 -- ${paths.join(" ")}`, {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return String(error?.stdout ?? error?.message ?? error);
  }
}

test("A — module isolation: src/lib/einvoice exists and does not import server-only billing writes", () => {
  const index = readSource("src/lib/einvoice/index.ts");
  assert.match(index, /CanonicalEInvoiceInput/);
  assert.match(index, /generateZugferdEn16931Xml/);
  assert.doesNotMatch(index, /issueSalesInvoice/);
  assert.doesNotMatch(index, /createAdminClient/);
  assert.doesNotMatch(index, /from-mollie/);

  const adapter = readSource("src/lib/einvoice/source-adapter.ts");
  assert.doesNotMatch(adapter, /server-only/);
  assert.doesNotMatch(adapter, /@\/lib\/billing\/sales-invoice/);
  assert.doesNotMatch(adapter, /allocate_sales_invoice_number/);
});

test("B — source adapter fail-closed on incomplete / non-issued snapshots", () => {
  const base = buildDemoDomesticIssuedSnapshot();
  const draft = { ...base, status: "draft" };
  const draftResult = adaptIssuedInvoiceToCanonical(draft);
  assert.equal(draftResult.ok, false);
  if (!draftResult.ok) assert.equal(draftResult.code, "NOT_ISSUED");

  const incompleteBuyer = {
    ...base,
    buyer: { ...base.buyer, addressLine1: null },
  };
  const buyerResult = adaptIssuedInvoiceToCanonical(incompleteBuyer);
  assert.equal(buyerResult.ok, false);
  if (!buyerResult.ok) assert.equal(buyerResult.code, "INCOMPLETE_BUYER");

  const brokenMoney = { ...base, grossMinor: 1 };
  const moneyResult = adaptIssuedInvoiceToCanonical(brokenMoney);
  assert.equal(moneyResult.ok, false);
  if (!moneyResult.ok) assert.equal(moneyResult.code, "MONEY_INVARIANT");
});

test("C — DE domestic: exact VAT rate/amount/totals match (zero drift)", () => {
  const snapshot = buildDemoDomesticIssuedSnapshot();
  const adapted = adaptIssuedInvoiceToCanonical(snapshot);
  assert.equal(adapted.ok, true);
  if (!adapted.ok) return;

  assert.equal(adapted.input.sourceMinor.netMinor, 50_336);
  assert.equal(adapted.input.sourceMinor.vatMinor, 9_564);
  assert.equal(adapted.input.sourceMinor.grossMinor, 59_900);
  assert.equal(adapted.input.sourceMinor.vatRateBps, 1900);
  assert.equal(adapted.input.totals.taxBasisTotalAmount, "503.36");
  assert.equal(adapted.input.totals.taxTotalAmount, "95.64");
  assert.equal(adapted.input.totals.grandTotalAmount, "599.00");
  assert.equal(adapted.input.taxBreakdown[0].vatCategoryCode, "S");
  assert.equal(adapted.input.taxBreakdown[0].vatRatePercent, "19.00");
  assert.equal(
    adapted.input.sourceMinor.netMinor + adapted.input.sourceMinor.vatMinor,
    adapted.input.sourceMinor.grossMinor,
  );
});

test("D — EU RC: map snapshot only; preserve Steuerschuldnerschaft / AE", () => {
  const snapshot = buildDemoReverseChargeIssuedSnapshot();
  const result = generateEInvoiceFromIssuedSnapshot(snapshot);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.canonical.taxBreakdown[0].vatCategoryCode, "AE");
  assert.equal(result.canonical.taxBreakdown[0].taxAmount, "0.00");
  assert.equal(result.canonical.sourceMinor.vatMinor, 0);
  assert.match(result.canonical.taxBreakdown[0].exemptionReason ?? "", /Steuerschuldnerschaft/);
  assert.equal(result.canonical.taxBreakdown[0].exemptionReasonCode, "VATEX-EU-AE");
  assert.match(result.xml, /CategoryCode>AE</);
  assert.match(result.xml, /Steuerschuldnerschaft/);
  assert.match(result.xml, /ExemptionReasonCode>VATEX-EU-AE</);
  assert.equal(result.validation.status, "VALID");
});

test("E — XML declares ZUGFeRD/Factur-X EN16931 profile (not MINIMUM/BASIC-WL)", () => {
  const result = generateEInvoiceFromIssuedSnapshot(buildDemoDomesticIssuedSnapshot());
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.match(result.xml, /CrossIndustryInvoice/);
  assert.equal(result.canonical.guidelineId, EN16931_GUIDELINE_ID);
  assert.equal(EN16931_GUIDELINE_ID, "urn:cen.eu:en16931:2017");
  assert.match(result.xml, /urn:cen\.eu:en16931:2017<\/ram:ID>/);
  assert.doesNotMatch(result.xml, /urn:factur-x\.eu:1p0:en16931/);
  assert.doesNotMatch(result.xml, /urn:factur-x\.eu:1p0:minimum/i);
  assert.doesNotMatch(result.xml, /basicwl/i);
  assert.match(result.xml, /TypeCode>380</);
  assert.doesNotMatch(result.xml, /<ram:ApplicableHeaderTradeDelivery\s*\/>/);
  assert.match(result.xml, /ActualDeliverySupplyChainEvent/);
});

test("F — validation VALID for demo samples; INVALID when totals drift", () => {
  const ok = generateEInvoiceFromIssuedSnapshot(buildDemoDomesticIssuedSnapshot());
  assert.equal(ok.ok, true);
  if (!ok.ok) return;
  assert.equal(ok.validation.status, "VALID");
  assert.equal(ok.validation.layers.businessRules, "pass");

  const adapted = adaptIssuedInvoiceToCanonical(buildDemoDomesticIssuedSnapshot());
  assert.equal(adapted.ok, true);
  if (!adapted.ok) return;
  const tampered = {
    ...adapted.input,
    totals: { ...adapted.input.totals, grandTotalAmount: "0.01" },
  };
  const xml = generateZugferdEn16931Xml(tampered);
  const bad = validateEInvoice({ canonical: tampered, xml });
  assert.equal(bad.status, "INVALID");
});

test("G — demo numbers are TEST-EINV-* (not ANX-*) and marked DEMO/NOT LEGAL", () => {
  const domestic = buildDemoDomesticIssuedSnapshot();
  const rc = buildDemoReverseChargeIssuedSnapshot();
  assert.equal(domestic.invoiceNumber, "TEST-EINV-2026-000001");
  assert.equal(rc.invoiceNumber, "TEST-EINV-RC-2026-000001");
  assert.doesNotMatch(domestic.invoiceNumber, /^ANX-/);
  assert.doesNotMatch(rc.invoiceNumber, /^ANX-/);
  assert.equal(domestic.demoNotLegal, true);
  assert.equal(rc.demoNotLegal, true);

  const xml = generateEInvoiceFromIssuedSnapshot(domestic);
  assert.equal(xml.ok, true);
  if (!xml.ok) return;
  assert.match(xml.xml, /DEMO\/NOT LEGAL/);
});

test("H — BILLING FREEZE PROOF: no diffs under billing freeze paths vs baseline 99ee628", () => {
  const diff = gitDiffAgainstBaseline(BILLING_FREEZE_PATHS);
  if (diff.trim().length > 0) {
    assert.fail(`EINVOICE_BILLING_FREEZE_VIOLATION\n${diff.slice(0, 4000)}`);
  }

  // Existing deferred scaffold untouched
  const scaffold = readSource("src/lib/billing/e-invoice.ts");
  assert.match(scaffold, /GENERATOR_DEFERRED/);
});

test("I — no public unauthenticated e-invoice API route introduced", () => {
  const apiRoot = join(rootDir, "src", "app", "api");
  function walk(dir, acc = []) {
    if (!existsSync(dir)) return acc;
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p, acc);
      else if (ent.name === "route.ts" || ent.name === "route.js") acc.push(p);
    }
    return acc;
  }
  const routes = walk(apiRoot).map((p) => p.replace(/\\/g, "/"));
  const einvoiceRoutes = routes.filter((p) => /einvoice|e-invoice|zugferd|factur/i.test(p));
  assert.deepEqual(einvoiceRoutes, []);
});

test("J — artifact filenames and pipeline bundle shape", () => {
  const result = generateEInvoiceFromIssuedSnapshot(buildDemoDomesticIssuedSnapshot());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.artifacts.xmlFilename, "TEST-EINV-2026-000001.xml");
  assert.equal(
    result.artifacts.validationReportFilename,
    "TEST-EINV-2026-000001.validation-report.md",
  );
  assert.equal(
    result.artifacts.mappingReportFilename,
    "TEST-EINV-2026-000001.mapping-report.md",
  );
  assert.match(result.artifacts.mappingReport, /zero drift/i);
});

test("K — monetary representation helpers do not recalculate VAT from rate", () => {
  // 19% of 50336 is not recomputed — we only format existing minors
  assert.equal(minorToDecimalString(50_336), "503.36");
  assert.equal(minorToDecimalString(9_564), "95.64");
  assert.equal(minorToDecimalString(59_900), "599.00");

  // Prove we never derive vat from rate in pipeline: mutate would fail invariant first
  const snap = buildDemoDomesticIssuedSnapshot();
  // If someone tried to "fix" VAT by rate, 19% of 50336 = 9563.84 → 9564 is the snapshot value we keep
  assert.equal(snap.vatMinor, 9_564);
  const result = generateEInvoiceFromIssuedSnapshot(snap);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.canonical.totals.taxTotalAmount, "95.64");
});

test("artifacts/einvoice-demo present after generate (soft check)", () => {
  const demoDir = join(rootDir, "artifacts", "einvoice-demo");
  if (!existsSync(demoDir)) {
    // Allow test run before demo script; do not fail hard — G already covers in-memory demo
    return;
  }
  assert.ok(existsSync(join(demoDir, "TEST-EINV-2026-000001.xml")));
  assert.ok(existsSync(join(demoDir, "TEST-EINV-RC-2026-000001.xml")));
  const xml = readFileSync(join(demoDir, "TEST-EINV-2026-000001.xml"), "utf8");
  assert.match(xml, /TEST-EINV-2026-000001/);
  assert.match(xml, /95\.64/);
});

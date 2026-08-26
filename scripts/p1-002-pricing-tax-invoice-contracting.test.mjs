/**
 * P1-002 remediation source-contract tests — pricing, tax, invoice, contracting, scrub.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

test("EUR price catalog uses minor units 17900 / 59900 / 179900", () => {
  const catalog = readSource("src/lib/billing/price-catalog.ts");
  assert.match(catalog, /PRIMARY_BILLING_CURRENCY.*=.*"EUR"/);
  assert.match(catalog, /amountMinor:\s*17_900/);
  assert.match(catalog, /amountMinor:\s*59_900/);
  assert.match(catalog, /amountMinor:\s*179_900/);
  assert.match(catalog, /ACTIVE_EUR_PRICE_VERSION/);
  assert.match(catalog, /FUTURE_CURRENCY_PRICE_SLOTS/);
  assert.match(catalog, /USD:\s*\[\]/);
  assert.match(catalog, /formatMinorUnitsForMollie/);
});

test("SUBSCRIPTION_PLANS is EUR with amountMinor", () => {
  const plans = readSource("src/lib/billing/plans.ts");
  assert.match(plans, /amountMinor/);
  assert.match(plans, /PRIMARY_BILLING_CURRENCY/);
  assert.doesNotMatch(plans, /currency:\s*"USD"/);
});

test("Tax determination separates UNKNOWN_BLOCK_CHECKOUT from 0%", () => {
  const policy = readSource("src/lib/billing/tax-policy.ts");
  assert.match(policy, /STANDARD_DOMESTIC_VAT/);
  assert.match(policy, /REVERSE_CHARGE/);
  assert.match(policy, /UNKNOWN_BLOCK_CHECKOUT/);
  assert.match(policy, /DE_STANDARD_VAT_RATE_BPS\s*=\s*1900/);
  assert.match(policy, /LEGAL_TEXT_PENDING_COUNSEL/);
  assert.match(policy, /eu_b2b_reverse_charge_legend_pending_counsel/);
});

test("VAT-inclusive calculation derives net/VAT from gross", () => {
  const taxes = readSource("src/lib/billing/taxes.ts");
  assert.match(taxes, /splitVatInclusiveGross/);
  assert.match(taxes, /calculateVatInclusiveBreakdown/);
  assert.match(taxes, /Cannot calculate tax for UNKNOWN_BLOCK_CHECKOUT/);
});

test("VIES abstraction is server-only and fail-closed", () => {
  const vies = readSource("src/lib/billing/vies.ts");
  assert.match(vies, /import "server-only"/);
  assert.match(vies, /status:\s*"unavailable"/);
  assert.match(vies, /validateVatIdWithVies/);
  assert.doesNotMatch(vies, /status:\s*"valid".*catch/);
});

test("Sales invoice domain owns Net/VAT/Total invariant", () => {
  const invoice = readSource("src/lib/billing/sales-invoice.ts");
  assert.match(invoice, /net \+ vat must equal gross/);
  assert.match(invoice, /toCustomerInvoiceView/);
  assert.match(invoice, /LEGAL_TEXT_PENDING_COUNSEL/);
  assert.doesNotMatch(invoice, /reverse charge applies under Article/);
});

test("E-Invoice domain ready — XML generator deferred (no fake XML)", () => {
  const einv = readSource("src/lib/billing/e-invoice.ts");
  assert.match(einv, /domain_model_ready/);
  assert.match(einv, /xmlGenerationEnabled:\s*false/);
  assert.match(einv, /GENERATOR_DEFERRED/);
  assert.doesNotMatch(einv, /<rsm:CrossIndustryInvoice/);
});

test("B2B contracting + DPA acceptance versions exist", () => {
  const contracting = readSource("src/lib/billing/contracting.ts");
  assert.match(contracting, /TERMS_DOCUMENT_VERSION/);
  assert.match(contracting, /DPA_DOCUMENT_VERSION/);
  assert.match(contracting, /LEGAL_TEXT_PENDING_COUNSEL/);
  assert.match(contracting, /buildCheckoutContractSummary/);
  assert.match(contracting, /organizationName/);
  const signup = readSource("src/components/auth/signup-form.tsx");
  assert.match(signup, /b2bEntrepreneurConfirmed/);
  assert.match(signup, /termsAccepted/);
  assert.doesNotMatch(signup, /defaultChecked/);
  const grid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.match(grid, /CheckoutContractSummaryDialog/);
  assert.match(grid, /prepareCheckoutContractSummaryAction/);
});

test("Customer-facing docs no longer claim Stripe/FastSpring billing", () => {
  const operations = readSource("src/lib/docs/pages/operations.ts");
  assert.doesNotMatch(operations, /Billing runs through Stripe/);
  assert.doesNotMatch(operations, /complete Stripe checkout/);
  assert.match(operations, /Mollie/);
  const account = readSource("src/lib/docs/pages/account.ts");
  assert.match(account, /Mollie/);
  assert.doesNotMatch(account, /FastSpring/);
  assert.doesNotMatch(account, /\bPaddle\b/);
  const billingMd = readSource("docs/billing.md");
  assert.match(billingMd, /Mollie-only/);
  assert.doesNotMatch(billingMd, /FastSpring-only/);
});

test("Marketing and legal catalog prices are EUR", () => {
  const marketing = readSource("src/lib/marketing/content.ts");
  assert.match(marketing, /€179/);
  assert.match(marketing, /€599/);
  assert.match(marketing, /€1,799/);
  assert.match(marketing, /Catalog list prices in EUR/);
  assert.match(marketing, /Tax treatment is determined from organization billing identity/);
  const legal = readSource("src/lib/company/legal-content.ts");
  assert.match(legal, /€179\/month/);
  assert.doesNotMatch(legal, /base USD catalog/);
});

test("Legal content does not reference discontinued EU ODR platform", () => {
  const legal = readSource("src/lib/company/legal-content.ts");
  assert.doesNotMatch(legal, /ec\.europa\.eu\/consumers\/odr/i);
  assert.doesNotMatch(legal, /European Commission provides an online dispute resolution platform/i);
  assert.doesNotMatch(legal, /524\/2013/);
  assert.match(
    legal,
    /not obliged and generally not willing to participate in dispute resolution proceedings before a consumer arbitration board/,
  );
});

test("Transaction currency refuses silent EUR default without catalog fallback path", () => {
  const currency = readSource("src/lib/billing/currency-model.ts");
  assert.match(currency, /refusing silent EUR default/);
  const tx = readSource("src/lib/billing/providers/mollie/transactions.ts");
  assert.match(tx, /resolveTransactionCurrency/);
  assert.doesNotMatch(tx, /\?\? "eur"/);
});

test("LIVE charging gate remains fail-closed", () => {
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /isMollieLiveChargingEnabled/);
  assert.match(rollout, /return false/);
  const envExample = readSource(".env.example");
  assert.match(envExample, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
});

test("P1-002 migration is additive for billing identity / invoices / acceptances", () => {
  assert.equal(
    pathExists("supabase/migrations/20250824100000_p1_002_pricing_tax_invoice_contracting.sql"),
    true,
  );
  const migration = readSource(
    "supabase/migrations/20250824100000_p1_002_pricing_tax_invoice_contracting.sql",
  );
  assert.match(migration, /organization_billing_identities/);
  assert.match(migration, /organization_contract_acceptances/);
  assert.match(migration, /sales_invoices/);
  assert.match(migration, /billing_currency/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.doesNotMatch(migration, /DROP TABLE/);
});

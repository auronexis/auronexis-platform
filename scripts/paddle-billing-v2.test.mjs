import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("billing history lists Paddle transactions with org scoping helpers", () => {
  const tx = readSource("src/lib/paddle/transactions.ts");
  const actions = readSource("src/lib/billing/invoice-actions.ts");
  const panel = readSource("src/components/settings/billing-history-panel.tsx");
  assert.match(tx, /listOrganizationBillingTransactions/);
  assert.match(tx, /organization_id/);
  assert.match(tx, /getPaddleInvoicePdfUrl/);
  assert.match(tx, /getInvoicePDF/);
  assert.match(tx, /Never invents a URL|only returns what Paddle/);
  assert.match(actions, /canManageOrganizationSettings/);
  assert.match(actions, /openPaddleInvoicePdfAction/);
  assert.match(panel, /No invoices are available yet/);
  assert.match(panel, /Download PDF/);
  assert.match(panel, /Load more/);
  assert.match(panel, /Merchant of Record/);
});

test("billing details expose next payment and payment method without inventing values", () => {
  const details = readSource("src/lib/paddle/subscription-details.ts");
  const panel = readSource("src/components/settings/billing-settings-panel.tsx");
  assert.match(details, /nextPayment/);
  assert.match(details, /paymentMethod/);
  assert.match(details, /return null/);
  assert.match(panel, /Next payment/);
  assert.match(panel, /Payment method/);
  assert.match(panel, /No upcoming payment is currently available/);
});

test("portal is secondary for invoices — history panel does not require portal for PDF", () => {
  const panel = readSource("src/components/settings/billing-history-panel.tsx");
  assert.match(panel, /openPaddleInvoicePdfAction/);
  assert.doesNotMatch(panel, /createPortalSessionAction/);
});

test("stripe cannot affect active billing after removal", () => {
  assert.equal(existsSync(join(rootDir, "src/lib/stripe")), false);
  assert.equal(existsSync(join(rootDir, "src/app/api/stripe")), false);
  const pkg = JSON.parse(readSource("package.json"));
  assert.equal(pkg.dependencies.stripe, undefined);
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "paddle"/);
  assert.doesNotMatch(provider, /return "stripe"/);
  const portal = readSource("src/lib/billing/customer-portal.ts");
  assert.match(portal, /createPaddlePortalSession/);
  assert.doesNotMatch(portal, /createStripePortalSession|createPortalSession as/);
});

test("archive migration preserves historical stripe records without dropping sources", () => {
  const migration = readSource(
    "supabase/migrations/20250718160000_paddle_billing_v2_stripe_archive.sql",
  );
  assert.match(migration, /legacy_stripe_customer_invoices/);
  assert.match(migration, /legacy_stripe_webhook_events/);
  assert.match(migration, /legacy_stripe_subscription_ids/);
  assert.match(migration, /amount_subtotal/);
  assert.doesNotMatch(migration, /DROP TABLE public\.customer_invoices/);
  assert.doesNotMatch(migration, /DROP COLUMN.*stripe_customer_id/);
});

test("webhook money parsing accepts string totals", () => {
  const money = readSource("src/lib/paddle/money.ts");
  const webhooks = readSource("src/lib/paddle/webhooks.ts");
  assert.match(money, /parsePaddleMoneyToCents/);
  assert.match(webhooks, /parsePaddleMoneyToCents/);
  assert.match(webhooks, /amount_subtotal|amountSubtotal/);
});

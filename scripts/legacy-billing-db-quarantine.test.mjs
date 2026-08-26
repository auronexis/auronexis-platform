/**
 * Legacy billing DB quarantine — authority must never flow from stripe/paddle/fastspring rows.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("legacy quarantine module defines authoritative Mollie-only row policy", () => {
  const quarantine = readSource("src/lib/billing/legacy-quarantine.ts");
  assert.match(quarantine, /isLegacyQuarantinedSubscriptionRow/);
  assert.match(quarantine, /isAuthoritativeSubscriptionRow/);
  assert.match(quarantine, /pickSubscriptionProviderHintRow/);
  assert.match(quarantine, /billing_provider === "mollie"/);
  assert.match(quarantine, /legacy_archived !== true/);
});

test("provider selection is Mollie-only — no FastSpring ownership", () => {
  const selection = readSource("src/lib/billing/provider-selection.ts");
  assert.match(selection, /isLegacyQuarantinedSubscriptionRow/);
  assert.doesNotMatch(selection, /existing_fastspring_subscription/);
  assert.doesNotMatch(selection, /fastspring_blocks_mollie/);
  assert.doesNotMatch(selection, /ownership: "fastspring"/);
  assert.match(selection, /Legacy stripe\/paddle\/fastspring rows never own an org/);
});

test("subscription selection filters quarantined rows before provider pick", () => {
  const sel = readSource("src/lib/billing/subscription-selection.ts");
  assert.match(sel, /isLegacyQuarantinedSubscriptionRow/);
  assert.match(sel, /authoritativeRows/);
});

test("active billing rejects quarantined rows for active billing", () => {
  const active = readSource("src/lib/billing/active-billing.ts");
  assert.match(active, /isLegacyQuarantinedSubscriptionRow/);
});

test("entitlements never use raw updated_at rows\[0\] for provider hint", () => {
  const resolver = readSource("src/lib/entitlements/resolver.ts");
  assert.match(resolver, /pickSubscriptionProviderHintRow/);
  assert.doesNotMatch(resolver, /preferredHint = rows\[0\]/);
  assert.match(resolver, /Legacy stripe\/paddle\/fastspring rows never grant access/);
});

test("effective plan resolver uses provider hint not rows[0]", () => {
  const effective = readSource("src/lib/plans/effective-plan.ts");
  assert.match(effective, /pickSubscriptionProviderHintRow/);
  assert.doesNotMatch(effective, /preferredHint = input\.rows\[0\]/);
});

test("billing queries select legacy quarantine columns", () => {
  const queries = readSource("src/lib/billing/queries.ts");
  assert.match(queries, /legacy_archived/);
  assert.match(queries, /pickSubscriptionProviderHintRow/);
});

test("Mollie organization sync allows overwrite of quarantined legacy rows", () => {
  const sync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(sync, /isLegacyQuarantinedSubscriptionRow/);
  assert.match(sync, /Mollie upsert may replace a quarantined legacy row/);
});

test("Mollie production checkout allows checkout when legacy row is quarantined", () => {
  const checkout = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(checkout, /isLegacyQuarantinedSubscriptionRow/);
  assert.match(checkout, /Legacy FastSpring rows are quarantined/);
});

test("billing snapshots job scopes to authoritative Mollie rows only", () => {
  const snapshots = readSource("src/lib/jobs/handlers/billing-snapshots.ts");
  assert.match(snapshots, /billing_provider", "mollie"/);
  assert.match(snapshots, /legacy_archived", false/);
});

test("forward-only migration quarantines legacy rows without renaming providers", () => {
  const migration = readSource(
    "supabase/migrations/20250826200000_legacy_billing_db_quarantine.sql",
  );
  assert.match(migration, /legacy_archived/);
  assert.match(migration, /legacy_archived_at/);
  assert.match(migration, /billing_provider IN \('stripe', 'paddle', 'fastspring'\)/);
  assert.match(migration, /legacy_quarantined/);
  assert.match(migration, /organization_subscriptions_legacy_authority_check/);
  assert.doesNotMatch(migration, /SET\s+billing_provider\s*=\s*'mollie'/i);
});

test("database types include legacy quarantine columns", () => {
  const types = readSource("src/types/database.ts");
  assert.match(types, /legacy_archived: boolean/);
  assert.match(types, /legacy_archived_at: string \| null/);
});

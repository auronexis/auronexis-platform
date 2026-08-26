/**
 * Mollie Phase 4 — production cutover hardening, subscription lifecycle & provider safety.
 * Source-contract suite (categories A–O). Preserves Phase 2/3 invariants.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

// A — Global provider + ownership vs eligibility vs default
test("A: getActiveBillingProvider returns mollie — sole active provider", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "mollie"/);
  assert.doesNotMatch(provider, /return "fastspring"/);
});

test("A: resolveBillingProviderForOrganization distinguishes ownership vs eligibility vs default", () => {
  const selection = readSource("src/lib/billing/provider-selection.ts");
  assert.match(selection, /resolveBillingProviderForOrganization/);
  assert.match(selection, /resolveBillingProviderOwnership/);
  assert.match(selection, /ownership: "mollie" \| "none"/);
  assert.match(selection, /mollie_default_for_new/);
  assert.match(selection, /Rollout \/ allowlist \/ default-for-new never overwrite ownership/);
  assert.match(selection, /existing_mollie_subscription/);
  assert.match(selection, /isLegacyQuarantinedSubscriptionRow/);
  assert.doesNotMatch(selection, /fastspring_blocks_mollie/);
});

// B — LIVE kill switch independent from ROLLOUT
test("B: LIVE charging gate is independent from rollout; default off", () => {
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /isMollieLiveChargingEnabled/);
  assert.match(rollout, /MOLLIE_LIVE_CHARGING_ENABLED/);
  assert.match(rollout, /Independent from MOLLIE_BILLING_ROLLOUT|independent from rollout/i);
  assert.match(rollout, /isMollieBillingRolloutEnabled/);
  assert.match(rollout, /isMollieDefaultForNewSubscriptions/);
  assert.match(rollout, /MOLLIE_BILLING_DEFAULT_FOR_NEW/);
  const envExample = readSource(".env.example");
  assert.match(envExample, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
  assert.match(envExample, /MOLLIE_BILLING_DEFAULT_FOR_NEW=false/);
  assert.match(envExample, /MOLLIE_BILLING_ROLLOUT=/);
});

// C — Centralized checkout eligibility + FastSpring coexistence
test("C: checkout eligibility centralizes provider_conflict and existing_subscription", () => {
  const eligibility = readSource("src/lib/billing/checkout-eligibility.ts");
  assert.match(eligibility, /resolveCheckoutEligibility/);
  assert.match(eligibility, /provider_conflict/);
  assert.match(eligibility, /existing_subscription/);
  assert.match(eligibility, /duplicate_mollie/);
  assert.match(eligibility, /allowed_mollie_plan_change/);
  assert.match(eligibility, /Legacy stripe\/paddle\/fastspring rows are quarantined/);
  assert.match(eligibility, /isLegacyQuarantinedSubscriptionRow/);
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /resolveCheckoutEligibility/);
  assert.match(actions, /Checkout is only available via Mollie/);
});

// D — Duplicate Mollie purchase protection
test("D: production checkout reuses open first payment and refuses duplicate sub_", () => {
  const prod = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(prod, /findReusableOpenFirstPayment/);
  assert.match(prod, /assertNoDuplicateMollieSubscription/);
  assert.match(prod, /assertNoFastSpringConflict/);
  assert.match(prod, /reusedOpenPayment/);
  assert.match(prod, /duplicate_mollie/);
  assert.match(prod, /customerPayments\.page/);
});

// E — Mollie customer reuse
test("E: Mollie organization customer reuses cst_ from organization_subscriptions", () => {
  const prod = readSource("src/lib/billing/providers/mollie/production-checkout.ts");
  assert.match(prod, /getOrCreateMollieOrganizationCustomer/);
  assert.match(prod, /provider_customer_id/);
  assert.match(prod, /startsWith\("cst_"\)/);
  assert.match(prod, /created: false/);
});

// F — Central lifecycle status mapping
test("F: lifecycle-status maps Mollie statuses centrally (pending/active/canceled/suspended/failed/expired)", () => {
  const status = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(status, /mapMollieSubscriptionStatus/);
  assert.match(status, /case "pending"/);
  assert.match(status, /case "active"/);
  assert.match(status, /case "suspended"/);
  assert.match(status, /return "past_due"/);
  assert.match(status, /case "failed"/);
  assert.match(status, /case "expired"/);
  assert.match(status, /MOLLIE_SUPPORTS_CANCEL_AT_PERIOD_END = true/);
  assert.match(status, /MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION = false/);
  const checkout = readSource("src/lib/billing/providers/mollie/checkout.ts");
  assert.match(checkout, /lifecycle-status/);
});

// G — Classic webhook only + authoritative reconcile
test("G: classic webhook API re-fetch; no Next-Gen / X-Mollie-Signature", () => {
  const route = readSource("src/app/api/mollie/webhook/route.ts");
  assert.match(route, /classic payment notification/i);
  assert.match(route, /isMollieLiveChargingEnabled/);
  assert.doesNotMatch(route, /X-Mollie-Signature/);
  assert.match(route, /Do NOT replace/i);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /client\.payments\.get\(paymentId\)/);
  assert.match(webhooks, /Never trust webhook body alone/i);
  assert.doesNotMatch(webhooks, /X-Mollie-Signature/);
});

// H — Webhook replay idempotency
test("H: webhook replay uses mollie_webhook_events idempotency ledger", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /ensureMollieIdempotency/);
  assert.match(webhooks, /mollie_webhook_events/);
  assert.match(webhooks, /status === "duplicate"/);
  assert.match(webhooks, /23505/);
  const route = readSource("src/app/api/mollie/webhook/route.ts");
  assert.match(route, /idempotency\.status === "duplicate"/);
});

// I — Payment failure → non-usable statuses; entitlements centralized
test("I: payment failure maps to past_due/inactive; entitlements use usable statuses only", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /payment_failed/);
  assert.match(webhooks, /past_due/);
  const entitlements = readSource("src/lib/entitlements/resolver.ts");
  assert.match(entitlements, /getOrganizationBillingProvider/);
  assert.match(entitlements, /Return-page callbacks never activate/);
  const status = readSource("src/lib/billing/status.ts");
  assert.match(status, /USABLE_STATUSES = new Set\(\["active", "trialing"\]\)/);
});

// J — Cancellation with paid-through local tracking (Phase 4.1)
test("J: Mollie cancel uses API + local cancel_at_period_end paid-through", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /cancelAtPeriodEnd: true/);
  assert.match(lifecycle, /customerSubscriptions\.cancel/);
  const status = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(status, /MOLLIE_SUPPORTS_CANCEL_AT_PERIOD_END = true/);
  assert.match(status, /MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION = false/);
});

// K — Plan change Pro↔Business without cancel+create
test("K: plan change updates amount in place — no cancel+create double bill", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /customerSubscriptions\.update/);
  assert.match(lifecycle, /never cancel\+create/i);
  assert.match(lifecycle, /getPlanByKey/);
  assert.match(lifecycle, /no invented proration/i);
});

// L — Rollback NEW Mollie without rewriting ownership
test("L: rollout rollback leaves Mollie ownership intact", () => {
  const selection = readSource("src/lib/billing/provider-selection.ts");
  assert.match(selection, /resolveBillingProviderOwnership/);
  assert.match(selection, /Legacy stripe\/paddle\/fastspring rows never own an org/);
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /Rollback NEW Mollie/i);
  assert.match(rollout, /Existing Mollie-owned/i);
  const ui = readSource("src/lib/billing/ui-status.ts");
  assert.match(ui, /organizationProvider/);
  assert.match(ui, /isMollieProductionCheckoutConfigured|sole active provider/i);
  assert.doesNotMatch(ui, /isMollieProductionCheckoutEligible/);
});

// M — Global cutover prep for NEW subs only
test("M: DEFAULT_FOR_NEW prepares cutover without mass migration", () => {
  const rollout = readSource("src/lib/billing/providers/mollie/rollout.ts");
  assert.match(rollout, /isMollieDefaultForNewSubscriptions/);
  const selection = readSource("src/lib/billing/provider-selection.ts");
  assert.match(selection, /mollie_default_for_new/);
  assert.match(selection, /Legacy stripe\/paddle\/fastspring rows never own an org/);
  const quarantine = readSource("src/lib/billing/legacy-quarantine.ts");
  assert.match(quarantine, /must never drive entitlements/);
});

// N — Security: no NEXT_PUBLIC secrets; LIVE remains false in docs/tests
test("N: no NEXT_PUBLIC Mollie secrets; LIVE charging stays false in example/tests", () => {
  const envExample = readSource(".env.example");
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_MOLLIE/);
  assert.match(envExample, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
  const client = readSource("src/lib/billing/providers/mollie/client.ts");
  assert.match(client, /import "server-only"/);
  const thisFile = readSource("scripts/mollie-billing-phase4.test.mjs");
  assert.doesNotMatch(thisFile, /MOLLIE_LIVE_CHARGING_ENABLED\s*=\s*true/);
});

// O — Phase 2/3 harness + report preserved
test("O: Phase 2 test harness and Phase 4 report exist; foundation phase updated", () => {
  assert.ok(pathExists("src/app/(dashboard)/settings/billing/mollie-test/page.tsx"));
  assert.ok(pathExists("src/lib/billing/providers/mollie/sync.ts"));
  assert.ok(pathExists("docs/mollie-phase-4-production-cutover-report.md"));
  const foundation = readSource("src/lib/billing/providers/mollie/foundation.ts");
  assert.match(foundation, /phase_4_production_cutover/);
  assert.match(foundation, /mollie_test_subscriptions/);
  assert.match(foundation, /NEVER the/);
});

// ---------------------------------------------------------------------------
// Phase 4 recovery — pending plan change lifecycle (runtime-truth contracts)
// ---------------------------------------------------------------------------

test("P: upgrade/downgrade schedules pending_plan and keeps authoritative provider_price_id", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  const sync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(lifecycle, /scheduleMolliePendingPlanChange/);
  assert.match(lifecycle, /currentPlanKey:\s*previousPlanKey/);
  assert.match(lifecycle, /pendingPlanKey:\s*input\.targetPlanKey/);
  assert.match(lifecycle, /never cancel\+create|Never cancel\+create/i);
  assert.match(sync, /pending_plan/);
  assert.match(sync, /provider_price_id:\s*input\.planKey/);
  assert.match(sync, /export async function applyMolliePendingPlanChangeIfReady/);
});

test("Q: paid webhook applies pending plan only after Mollie confirmation", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /applyMolliePendingPlanChangeIfReady/);
  assert.match(webhooks, /authoritativePlanKey|pendingApply\.planKey|pendingApply\.applied/);
  assert.match(webhooks, /failedPlanKey/);
});

test("R: Mollie downgrade UI is not blocked by FastSpring portal unavailability", () => {
  const reasons = readSource("src/lib/diagnostics/pricing-reasons.ts");
  assert.match(reasons, /billingProvider\?/);
  assert.match(reasons, /billingProvider !== "mollie"/);
  const grid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.match(grid, /billingProvider:\s*safeSelection\.billingProvider/);
});

test("S: Mollie billing panel exposes management panel without portal theatre", () => {
  const panel = readSource("src/components/settings/billing-settings-panel.tsx");
  assert.match(panel, /BillingMollieManagementPanel/);
  const molliePanel = readSource("src/components/settings/billing-mollie-management-panel.tsx");
  assert.match(molliePanel, /cancelMollieSubscriptionAction/);
  assert.match(molliePanel, /Cancel subscription/);
});

test("T: pending plan columns migration is additive and RLS-safe", () => {
  const migration = readSource(
    "supabase/migrations/20250822010000_mollie_pending_plan_change.sql",
  );
  assert.match(migration, /ADD COLUMN IF NOT EXISTS pending_plan/);
  assert.match(migration, /pending_plan_effective_at/);
  assert.match(migration, /pending_plan_change_type/);
  assert.match(migration, /provider_change_reference/);
  assert.doesNotMatch(migration, /DROP TABLE/i);
  assert.doesNotMatch(migration, /DISABLE ROW LEVEL SECURITY/i);
});

test("U: plan-change action success copy does not claim immediate entitlements", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /formatPlanChangeScheduledSuccessMessage/);
  const planChange = readSource("src/lib/billing/plan-change.ts");
  assert.match(planChange, /remains your current plan until then/i);
});

test("X: duplicate plan-change errors map to customer-safe messages", () => {
  const errors = readSource("src/lib/billing/errors.ts");
  assert.match(errors, /resolvePlanChangeCustomerError/);
  assert.match(errors, /PLAN_CHANGE_ALREADY_SCHEDULED_MESSAGE/);
  assert.match(errors, /isExpectedPlanChangeError/);
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /isExpectedPlanChangeError/);
  assert.match(actions, /\[billing\]\[plan-change\]/);
});

test("Y: scheduled plan change surfaces in billing overview and plans UI", () => {
  const types = readSource("src/lib/billing/types.ts");
  assert.match(types, /scheduledPlanChange/);
  assert.match(types, /resolveScheduledPlanChange/);
  const grid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.match(grid, /resolvePlanCardAction/);
  assert.match(grid, /scheduledPlanChange/);
  assert.match(grid, /variant="success"/);
  const panel = readSource("src/components/settings/billing-settings-panel.tsx");
  assert.match(panel, /Scheduled plan change/);
  assert.match(panel, /formatScheduledPlanChangeSummary/);
});

test("Z: plan-change transactional emails use billing_system ledger idempotency", () => {
  const email = readSource("src/lib/email/plan-change.ts");
  assert.match(email, /sendPlanChangeScheduledEmail/);
  assert.match(email, /sendPlanChangeAppliedEmail/);
  assert.match(email, /EMAIL_CATEGORIES\.BILLING_SYSTEM/);
  assert.match(email, /\[email\]\[plan-change\]/);
  const planChange = readSource("src/lib/billing/plan-change.ts");
  assert.match(planChange, /buildPlanChangeScheduledTemplateKey/);
  assert.match(planChange, /buildPlanChangeAppliedTemplateKey/);
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /sendPlanChangeScheduledEmail/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /sendPlanChangeAppliedEmail/);
  const templates = readSource("src/lib/email/templates/plan-change.ts");
  assert.match(templates, /buildPlanChangeScheduledHtml/);
  assert.match(templates, /buildPlanChangeAppliedHtml/);
});

test("AA: final state and notifications doc exists with manual scenarios", () => {
  assert.ok(pathExists("docs/mollie-phase-4-final-state-and-notifications.md"));
  const doc = readSource("docs/mollie-phase-4-final-state-and-notifications.md");
  assert.match(doc, /FINAL VERDICT/);
  assert.match(doc, /Manual test scenario/i);
  assert.match(doc, /Cancel scheduled change/i);
});

test("V: LIVE charging remains disabled in example env", () => {
  const envExample = readSource(".env.example");
  assert.match(envExample, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
});

test("W: recovery audit report documents runtime truth verdict", () => {
  assert.ok(pathExists("docs/mollie-phase-4-recovery-audit.md"));
  const report = readSource("docs/mollie-phase-4-recovery-audit.md");
  assert.match(report, /FINAL VERDICT/);
  assert.match(report, /pending_plan/);
  assert.match(report, /NO PLAN CHANGE AUTHORITATIVE UNTIL PROVIDER CONFIRMS/i);
});

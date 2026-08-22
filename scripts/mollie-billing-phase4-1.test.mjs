/**
 * Mollie Phase 4.1 — subscription management & cancellation lifecycle.
 * Source-contract suite (categories A–R). Preserves Phase 4 plan-change contracts.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

// A — Cancel scheduled plan change restores provider amount before clearing pending
test("A: cancel scheduled plan change re-fetches Mollie and restores authoritative plan", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /cancelMollieScheduledPlanChange/);
  assert.match(lifecycle, /customerSubscriptions\.get/);
  assert.match(lifecycle, /customerSubscriptions\.update/);
  assert.match(lifecycle, /verifyMollieSubscriptionAmount/);
  assert.match(lifecycle, /clearPendingPlanChange: true/);
  assert.match(lifecycle, /\[billing\]\[plan-change-cancel\]/);
  assert.match(lifecycle, /upsertMollieOrganizationSubscription/);
});

// B — Provider failure must not clear pending (verify before clear)
test("B: plan change cancel refuses local clear when provider amount verify fails", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /Mollie did not confirm the restored plan amount/);
  assert.match(lifecycle, /pending change kept/i);
});

// C — Idempotent plan change cancel message
test("C: plan change cancel idempotency message", () => {
  const mgmt = readSource("src/lib/billing/subscription-management.ts");
  assert.match(mgmt, /PLAN_CHANGE_CANCEL_ALREADY_MESSAGE/);
  assert.match(mgmt, /Scheduled plan change has already been canceled/);
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /PLAN_CHANGE_CANCEL_ALREADY_MESSAGE/);
});

// D — Subscription cancel uses Mollie API + local cancel_at_period_end
test("D: subscription cancel calls Mollie cancel and sets cancel_at_period_end", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /customerSubscriptions\.cancel/);
  assert.match(lifecycle, /cancelAtPeriodEnd: true/);
  assert.match(lifecycle, /clearPendingPlanChange: true/);
  assert.match(lifecycle, /\[billing\]\[subscription-cancel\]/);
  assert.doesNotMatch(lifecycle, /mandates\.revoke|customers\.delete/);
});

// E — Paid-through semantics centralized
test("E: subscription management resolves paid-through usability", () => {
  const mgmt = readSource("src/lib/billing/subscription-management.ts");
  assert.match(mgmt, /resolveSubscriptionUsability/);
  assert.match(mgmt, /isSubscriptionPaidThroughPeriodEnd/);
  const active = readSource("src/lib/billing/active-billing.ts");
  assert.match(active, /resolveSubscriptionUsability/);
  const status = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(status, /resolveMollieStoredSubscriptionStatus/);
  assert.match(status, /MOLLIE_SUPPORTS_CANCEL_AT_PERIOD_END = true/);
});

// F — Webhook/reconciliation finalizes expired cancellation + subscription_ended email
test("F: webhook reconciliation expires paid-through cancellation", () => {
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /finalizeMollieSubscriptionIfExpired/);
  assert.match(webhooks, /sendSubscriptionEndedEmail/);
  assert.match(webhooks, /\[billing\]\[subscription-expire\]/);
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /finalizeMollieSubscriptionIfExpired/);
});

// G — Resume not supported
test("G: Mollie subscription reactivation remains unsupported", () => {
  const status = readSource("src/lib/billing/providers/mollie/lifecycle-status.ts");
  assert.match(status, /MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION = false/);
  const mgmt = readSource("src/lib/billing/subscription-management.ts");
  assert.match(mgmt, /canResumeSubscription: false/);
});

// H — RBAC owner/admin actions
test("H: subscription management actions require canManageOrganizationSettings", () => {
  const actions = readSource("src/lib/billing/actions.ts");
  assert.match(actions, /cancelMollieScheduledPlanChangeAction/);
  assert.match(actions, /cancelMollieSubscriptionAction/);
  assert.match(actions, /canManageOrganizationSettings/);
});

// I — Transactional emails idempotent via billing_system ledger
test("I: subscription management emails use billing_system ledger", () => {
  const email = readSource("src/lib/email/subscription-management.ts");
  assert.match(email, /sendPlanChangeCanceledEmail/);
  assert.match(email, /sendSubscriptionCancellationScheduledEmail/);
  assert.match(email, /sendSubscriptionEndedEmail/);
  assert.match(email, /EMAIL_CATEGORIES\.BILLING_SYSTEM/);
  const mgmt = readSource("src/lib/billing/subscription-management.ts");
  assert.match(mgmt, /buildPlanChangeCanceledTemplateKey/);
  assert.match(mgmt, /buildSubscriptionCancellationScheduledTemplateKey/);
  assert.match(mgmt, /buildSubscriptionEndedTemplateKey/);
  const templates = readSource("src/lib/email/templates/subscription-management.ts");
  assert.match(templates, /buildSubscriptionEndedHtml/);
});

// J — Billing UI exposes cancel scheduled change + cancel subscription modals
test("J: billing UI exposes Mollie subscription management panel", () => {
  assert.ok(pathExists("src/components/settings/billing-mollie-management-panel.tsx"));
  const panel = readSource("src/components/settings/billing-mollie-management-panel.tsx");
  assert.match(panel, /cancelMollieScheduledPlanChangeAction/);
  assert.match(panel, /cancelMollieSubscriptionAction/);
  assert.match(panel, /Cancel scheduled/);
  assert.match(panel, /Cancel subscription/);
  assert.match(panel, /Dialog/);
  const settings = readSource("src/components/settings/billing-settings-panel.tsx");
  assert.match(settings, /BillingMollieManagementPanel/);
});

// K — Plans page reflects cancellation state
test("K: plans page blocks changes when cancellation scheduled", () => {
  const reasons = readSource("src/lib/diagnostics/pricing-reasons.ts");
  assert.match(reasons, /cancellation is scheduled/i);
  const grid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.match(grid, /Cancellation scheduled/);
});

// L — Phase 4 plan change contracts preserved
test("L: Phase 4 plan change schedule/apply contracts preserved", () => {
  const lifecycle = readSource("src/lib/billing/providers/mollie/lifecycle.ts");
  assert.match(lifecycle, /changeMollieOrganizationPlan/);
  assert.match(lifecycle, /scheduleMolliePendingPlanChange/);
  const webhooks = readSource("src/lib/billing/providers/mollie/webhooks.ts");
  assert.match(webhooks, /applyMolliePendingPlanChangeIfReady/);
  const planChange = readSource("src/lib/billing/plan-change.ts");
  assert.match(planChange, /PLAN_CHANGE_ALREADY_SCHEDULED_MESSAGE/);
});

// M — No migration required (cancel_at_period_end exists)
test("M: no new migration for cancel_at_period_end — column already present", () => {
  const migration = readSource(
    "supabase/migrations/20250822010000_mollie_pending_plan_change.sql",
  );
  assert.doesNotMatch(migration, /cancel_at_period_end/);
  const types = readSource("src/types/database.ts");
  assert.match(types, /cancel_at_period_end: boolean/);
});

// N — LIVE charging remains disabled in example
test("N: LIVE charging remains disabled in example env", () => {
  const envExample = readSource(".env.example");
  assert.match(envExample, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
});

// O — Global provider remains fastspring
test("O: getActiveBillingProvider remains fastspring", () => {
  const provider = readSource("src/lib/billing/provider.ts");
  assert.match(provider, /return "fastspring"/);
});

// P — FastSpring coexistence unchanged
test("P: Mollie writes refuse FastSpring overwrite", () => {
  const sync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(sync, /assertCanWriteMollieOrganizationSubscription/);
  assert.match(sync, /Refusing Mollie write/);
});

// Q — Pending plan not applied when cancellation scheduled
test("Q: pending plan apply skipped when cancel_at_period_end", () => {
  const sync = readSource("src/lib/billing/providers/mollie/organization-sync.ts");
  assert.match(sync, /cancel_at_period_end/);
  assert.match(sync, /if \(existing\.cancel_at_period_end\)/);
});

// R — Phase 4.1 documentation report exists
test("R: Phase 4.1 documentation report exists with verdict", () => {
  assert.ok(pathExists("docs/mollie-phase-4-1-subscription-management.md"));
  const doc = readSource("docs/mollie-phase-4-1-subscription-management.md");
  assert.match(doc, /FINAL VERDICT/);
  assert.match(doc, /plan_change_canceled/);
  assert.match(doc, /subscription_cancellation_scheduled/);
  assert.match(doc, /subscription_ended/);
});

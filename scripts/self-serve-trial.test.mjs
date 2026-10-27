/**
 * Self-serve 7-day free trial: no payment details, ends automatically, one per company,
 * abuse-limited, and replaced (not stacked) by a paid subscription.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/self-serve-trial.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const policy = await import("@/lib/trial/policy");
const { resolveEffectivePlanFromSubscriptionRows } = await import("@/lib/plans/effective-plan");

describe("trial policy", () => {
  it("is 7 days on Business with abuse limits", () => {
    assert.equal(policy.TRIAL_LENGTH_DAYS, 7);
    assert.equal(policy.TRIAL_PLAN, "business");
    assert.equal(policy.TRIAL_CLIENT_LIMIT, 10);
    assert.equal(policy.TRIAL_SEAT_LIMIT, 3);
    assert.equal(policy.TRIAL_AI_CREDITS, 50);
  });

  it("normalizes addresses so +tags and Gmail dots do not create new trials", () => {
    assert.equal(policy.normalizeEmailForTrial("Jane.Doe+trial2@GMail.com").normalized, "janedoe@gmail.com");
    assert.equal(policy.normalizeEmailForTrial("j.doe@googlemail.com").normalized, "jdoe@gmail.com");
    assert.equal(policy.normalizeEmailForTrial("ops+x@agency.co.uk").normalized, "ops@agency.co.uk");
    assert.equal(policy.normalizeEmailForTrial("first.last@agency.co.uk").normalized, "first.last@agency.co.uk");
    assert.equal(policy.normalizeEmailForTrial("not-an-email"), null);
  });

  it("classifies freemail and disposable domains", () => {
    assert.equal(policy.normalizeEmailForTrial("a@gmail.com").isFreemail, true);
    assert.equal(policy.normalizeEmailForTrial("a@agency.com").isFreemail, false);
    assert.equal(policy.normalizeEmailForTrial("a@mailinator.com").isDisposable, true);
    assert.equal(policy.normalizeEmailForTrial("a@sub.yopmail.com").isDisposable, true);
    assert.equal(policy.normalizeEmailForTrial("a@agency.com").isDisposable, false);
  });

  it("computes expiry and remaining days", () => {
    const start = new Date("2026-10-27T10:00:00Z");
    const end = policy.computeTrialExpiry(start);
    assert.equal(end.toISOString(), "2026-11-03T10:00:00.000Z");
    assert.equal(policy.trialDaysRemaining(end.toISOString(), start), 7);
    assert.equal(policy.trialDaysRemaining(end.toISOString(), new Date("2026-11-03T09:00:00Z")), 1);
    assert.equal(policy.isTrialExpired(end.toISOString(), new Date("2026-11-03T10:00:00Z")), true);
    assert.equal(policy.trialDaysRemaining(end.toISOString(), new Date("2026-11-04T00:00:00Z")), 0);
    assert.equal(policy.isTrialExpired(null), true);
  });

  it("a paid subscription replaces the trial override", () => {
    const trial = { source: "trial", status: "active" };
    const admin = { source: "admin", status: "active" };
    assert.equal(policy.overrideAppliesWithSubscription(trial, true), null);
    assert.equal(policy.overrideAppliesWithSubscription(trial, false), trial);
    assert.equal(policy.overrideAppliesWithSubscription(admin, true), admin);
    assert.equal(policy.overrideAppliesWithSubscription(null, false), null);
  });
});

describe("plan resolution", () => {
  const orgId = "00000000-0000-4000-8000-000000000001";

  it("an active trial grants Business, labelled as free trial", () => {
    const resolved = resolveEffectivePlanFromSubscriptionRows({
      organizationId: orgId,
      rows: [],
      planOverride: { status: "active", plan: "business", source: "trial" },
    });
    assert.equal(resolved.planKey, "business");
    assert.equal(resolved.planLabel, "Business (free trial)");
    assert.equal(resolved.planOverrideActive, true);
  });

  it("an expired trial grants nothing", () => {
    const resolved = resolveEffectivePlanFromSubscriptionRows({
      organizationId: orgId,
      rows: [],
      planOverride: { status: "expired", plan: "business", source: "trial" },
    });
    assert.equal(resolved.planOverrideActive, false);
    assert.equal(resolved.isPaidAccess, false);
  });
});

describe("wiring", () => {
  it("overrides past expires_at are mapped as expired at read time", () => {
    const queries = readSource("src/lib/enterprise/queries.ts");
    assert.match(queries, /isTrialExpired\(expiresAt\)/);
    assert.match(queries, /status: expired \? "expired"/);
  });

  it("manual overrides always clear trial source and expiry", () => {
    const admin = readSource("src/lib/enterprise/admin-actions.ts");
    assert.match(admin, /source: "admin",\s*expires_at: null,/);
  });

  it("signup rejects disposable addresses before creating anything and grants the trial after provisioning", () => {
    const actions = readSource("src/lib/auth/actions.ts");
    assert.ok(actions.indexOf("isDisposable") < actions.indexOf("admin.auth.admin.createUser"));
    assert.ok(actions.indexOf('.from("users")') < actions.indexOf("startTrialForNewOrganization({"));
    assert.match(actions, /trial=\$\{trialParam\}/);
  });

  it("trial claims are unique per email and per company domain, service-role only", () => {
    const migration = readSource("supabase/migrations/20261027120000_self_serve_trial.sql");
    assert.match(migration, /unique index if not exists trial_claims_email_hash_key/);
    assert.match(migration, /trial_claims_domain_hash_key\s+on public\.trial_claims \(domain_hash\) where domain_hash is not null/);
    assert.match(migration, /enable row level security/);
    assert.match(migration, /check \(source <> 'trial' or expires_at is not null\)/);
    const service = readSource("src/lib/trial/service.ts");
    assert.match(service, /email\.isFreemail \? null/);
    assert.match(service, /"23505"/);
    assert.doesNotMatch(service, /email: input\.email/);
  });

  it("trial workspaces can email reports only to their own members", () => {
    const actions = readSource("src/lib/reports/email-actions.ts");
    assert.match(actions, /planContext\.trial\?\.active/);
    assert.match(actions, /member\.email \?\? ""\)\.trim\(\)\.toLowerCase\(\) === recipient/);
  });

  it("trial AI credits are capped and pilot eligibility ignores trial access", () => {
    const resolver = readSource("src/lib/entitlements/resolver.ts");
    assert.match(resolver, /TRIAL_AI_CREDITS/);
    assert.match(readSource("src/lib/sales/capture-actions.ts"), /entitlements\.isPaidAccess && !entitlements\.isTrial/);
  });

  it("terms, refund policy and privacy describe the trial", () => {
    const legal = readSource("src/lib/company/legal-content.ts");
    assert.match(legal, /heading: "10a\. Free trial"/);
    assert.match(legal, /does not convert into a paid subscription and does not renew/);
    assert.match(legal, /heading: "Free trial"/);
    assert.match(legal, /evaluate the Business plan free of charge for 7 days/);
  });

  it("dashboard shows the trial banner", () => {
    const layout = readSource("src/app/(dashboard)/layout.tsx");
    assert.match(layout, /<TrialBanner/);
  });
});

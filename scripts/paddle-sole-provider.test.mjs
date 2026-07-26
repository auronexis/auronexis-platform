/**
 * Executable regression tests for active-billing predicates after FastSpring cutover.
 * Mirrors the pure helpers in src/lib/billing/active-billing.ts —
 * keep in sync when those predicates change.
 *
 * New checkouts use FastSpring; usable legacy Paddle rows remain entitled.
 */
import assert from "node:assert/strict";
import test from "node:test";

const ABANDONED = new Set(["incomplete", "incomplete_expired", "pending", "processing"]);
const USABLE = new Set(["active", "trialing"]);

function normalize(status) {
  return (status ?? "").trim().toLowerCase() || "inactive";
}

function isUsable(status) {
  return USABLE.has(normalize(status));
}

function isPaddleBacked(row) {
  return row?.billing_provider === "paddle";
}

function hasVerifiedPaddleCustomer(row) {
  return isPaddleBacked(row) && Boolean(row?.provider_customer_id?.startsWith("ctm_"));
}

function hasVerifiedPaddleSubscription(row) {
  return isPaddleBacked(row) && Boolean(row?.provider_subscription_id?.startsWith("sub_"));
}

function isStripeBacked(row) {
  if (!row || row.billing_provider === "paddle" || row.billing_provider === "fastspring") {
    return false;
  }
  return (
    row.billing_provider === "stripe" ||
    Boolean(row.stripe_customer_id || row.stripe_subscription_id || row.stripe_price_id)
  );
}

function isStaleStripeAbandonedCheckout(row) {
  if (!row || !isStripeBacked(row)) return false;
  if (hasVerifiedPaddleSubscription(row) || isPaddleBacked(row)) return false;
  if (row.stripe_subscription_id?.trim()) return false;
  if (isUsable(row.status)) return false;
  return ABANDONED.has(normalize(row.status));
}

function isFastSpringBacked(row) {
  return row?.billing_provider === "fastspring";
}

function hasVerifiedFastSpringSubscription(row) {
  return isFastSpringBacked(row) && Boolean(row?.provider_subscription_id?.trim());
}

function isActiveBillingRow(row, activeProvider) {
  if (!row) return false;
  if (isStaleStripeAbandonedCheckout(row)) return false;
  if (activeProvider === "fastspring") {
    return isFastSpringBacked(row) || isPaddleBacked(row);
  }
  if (activeProvider === "paddle") {
    if (isStripeBacked(row) && !isPaddleBacked(row)) return false;
    return isPaddleBacked(row);
  }
  return true;
}

function selectPreferred(rows, activeProvider) {
  const candidates = rows.filter((row) => isActiveBillingRow(row, activeProvider));
  if (activeProvider === "fastspring") {
    const fs = candidates.find((row) => isFastSpringBacked(row) && isUsable(row.status));
    if (fs) return fs;
    const paddle = candidates.find((row) => isPaddleBacked(row) && isUsable(row.status));
    if (paddle) return paddle;
    return (
      candidates.find((row) => isFastSpringBacked(row)) ??
      candidates.find((row) => isPaddleBacked(row)) ??
      null
    );
  }
  if (activeProvider === "paddle") {
    return candidates.find((row) => isPaddleBacked(row)) ?? null;
  }
  return candidates[0] ?? null;
}

function resolveFlags(row, activeProvider) {
  if (!row || !isActiveBillingRow(row, activeProvider)) {
    return {
      isUsable: false,
      isPaymentPending: false,
      hasSubscription: false,
    };
  }
  if (activeProvider === "fastspring") {
    if (isPaddleBacked(row)) {
      const status = row.provider_status ?? row.status;
      return {
        isUsable: isUsable(status),
        isPaymentPending: Boolean(row.sync_pending) || ABANDONED.has(normalize(status)),
        hasSubscription: hasVerifiedPaddleSubscription(row),
      };
    }
    const status = row.provider_status ?? row.status;
    return {
      isUsable: isUsable(status),
      isPaymentPending: Boolean(row.sync_pending) || ABANDONED.has(normalize(status)),
      hasSubscription: hasVerifiedFastSpringSubscription(row),
    };
  }
  if (activeProvider === "paddle") {
    const status = row.provider_status ?? row.status;
    return {
      isUsable: isUsable(status),
      isPaymentPending: Boolean(row.sync_pending) || ABANDONED.has(normalize(status)),
      hasSubscription: hasVerifiedPaddleSubscription(row),
    };
  }
  return {
    isUsable: isUsable(row.status),
    isPaymentPending: ABANDONED.has(normalize(row.status)),
    hasSubscription: Boolean(row.stripe_subscription_id),
  };
}

function canOpenPortal({ activeProvider, canManage, portalAvailable, subscription }) {
  if (!canManage || !portalAvailable) return false;
  if (activeProvider === "paddle") {
    return hasVerifiedPaddleCustomer(subscription);
  }
  return Boolean(subscription?.stripe_customer_id || subscription?.provider_customer_id);
}

const staleStripeIncomplete = {
  billing_provider: "stripe",
  status: "incomplete",
  stripe_customer_id: "cus_testagency",
  stripe_subscription_id: null,
  stripe_price_id: null,
  provider_customer_id: "cus_testagency",
  provider_subscription_id: null,
  provider_price_id: null,
  provider_status: "incomplete",
  sync_pending: false,
};

const paddleActive = {
  billing_provider: "paddle",
  status: "active",
  stripe_customer_id: "cus_legacy",
  stripe_subscription_id: null,
  provider_customer_id: "ctm_verified",
  provider_subscription_id: "sub_verified",
  provider_price_id: "pri_test",
  provider_status: "active",
  sync_pending: false,
};

test("1. paddle mode + stale Stripe incomplete + no Stripe subscription id → checkout flags clear", () => {
  assert.equal(isStaleStripeAbandonedCheckout(staleStripeIncomplete), true);
  assert.equal(selectPreferred([staleStripeIncomplete], "paddle"), null);
  const flags = resolveFlags(null, "paddle");
  assert.equal(flags.isPaymentPending, false);
  assert.equal(flags.isUsable, false);
  assert.equal(flags.hasSubscription, false);
});

test("2. paddle mode + stale Stripe customer id → portal not opened via Stripe customer", () => {
  assert.equal(
    canOpenPortal({
      activeProvider: "paddle",
      canManage: true,
      portalAvailable: true,
      subscription: staleStripeIncomplete,
    }),
    false,
  );
  assert.equal(hasVerifiedPaddleCustomer(staleStripeIncomplete), false);
});

test("3. paddle mode + no Paddle customer → portal hidden", () => {
  assert.equal(
    canOpenPortal({
      activeProvider: "paddle",
      canManage: true,
      portalAvailable: true,
      subscription: null,
    }),
    false,
  );
});

test("4. paddle mode + valid Paddle customer → portal allowed", () => {
  assert.equal(
    canOpenPortal({
      activeProvider: "paddle",
      canManage: true,
      portalAvailable: true,
      subscription: paddleActive,
    }),
    true,
  );
});

test("5. paddle mode: Stripe status does not determine plan or checkout blocking", () => {
  const preferred = selectPreferred([staleStripeIncomplete], "paddle");
  assert.equal(preferred, null);
  const flags = resolveFlags(staleStripeIncomplete, "paddle");
  assert.equal(flags.isPaymentPending, false);
  assert.equal(flags.isUsable, false);
});

test("6. historical Stripe customer id preserved on stale remnant classification", () => {
  assert.equal(staleStripeIncomplete.stripe_customer_id, "cus_testagency");
  assert.equal(isStaleStripeAbandonedCheckout(staleStripeIncomplete), true);
});

test("7. unknown paddle status fails closed (not usable)", () => {
  const unknown = {
    ...paddleActive,
    status: "weird_status",
    provider_status: "weird_status",
  };
  assert.equal(isUsable(unknown.provider_status), false);
});

test("8. verified Paddle subscription controls entitlements usability", () => {
  const flags = resolveFlags(paddleActive, "paddle");
  assert.equal(flags.isUsable, true);
  assert.equal(flags.hasSubscription, true);
  const staleFlags = resolveFlags(staleStripeIncomplete, "paddle");
  assert.equal(staleFlags.isUsable, false);
});

test("9. organization isolation: preferred selection only considers provided org rows", () => {
  const otherOrgPaddle = { ...paddleActive, organization_id: "other" };
  const preferred = selectPreferred([staleStripeIncomplete, otherOrgPaddle], "paddle");
  assert.equal(preferred?.provider_customer_id, "ctm_verified");
  assert.equal(selectPreferred([staleStripeIncomplete], "paddle"), null);
});

test("10. checkout success path is canonical billing route", async () => {
  const { readFileSync } = await import("node:fs");
  const { dirname, join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const success = readFileSync(join(root, "src/lib/paddle/checkout-success.ts"), "utf8");
  assert.match(success, /\/settings\/billing\?checkout=success/);
  assert.doesNotMatch(success, /grant access|activate entitlements/i);
});

test("11. portal hidden before customer; active with valid ctm_ id", () => {
  assert.equal(
    canOpenPortal({
      activeProvider: "paddle",
      canManage: true,
      portalAvailable: true,
      subscription: { billing_provider: "paddle", provider_customer_id: null },
    }),
    false,
  );
  assert.equal(
    canOpenPortal({
      activeProvider: "paddle",
      canManage: true,
      portalAvailable: true,
      subscription: paddleActive,
    }),
    true,
  );
});

test("12. no entitlement from client callback — sync requires usable verified paddle sub", () => {
  const pendingAfterCheckout = {
    billing_provider: "paddle",
    status: "incomplete",
    provider_status: "pending_sync",
    sync_pending: true,
    provider_customer_id: null,
    provider_subscription_id: null,
  };
  const flags = resolveFlags(pendingAfterCheckout, "paddle");
  assert.equal(flags.isUsable, false);
  assert.equal(flags.hasSubscription, false);
  assert.equal(resolveFlags(paddleActive, "paddle").isUsable, true);
});

test("13. fastspring mode: usable legacy Paddle row remains entitled", () => {
  assert.equal(isActiveBillingRow(paddleActive, "fastspring"), true);
  const flags = resolveFlags(paddleActive, "fastspring");
  assert.equal(flags.isUsable, true);
  assert.equal(flags.hasSubscription, true);
  assert.equal(selectPreferred([staleStripeIncomplete, paddleActive], "fastspring")?.provider_customer_id, "ctm_verified");
});

test("14. fastspring mode: stale Stripe incomplete never preferred", () => {
  assert.equal(selectPreferred([staleStripeIncomplete], "fastspring"), null);
  assert.equal(resolveFlags(staleStripeIncomplete, "fastspring").isUsable, false);
});

test("15. provider source: FastSpring active, Paddle checkout disabled, no Stripe", async () => {
  const { readFileSync } = await import("node:fs");
  const { dirname, join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const provider = readFileSync(join(root, "src/lib/billing/provider.ts"), "utf8");
  assert.match(provider, /return "fastspring"/);
  assert.doesNotMatch(provider, /return "stripe"/);
  assert.match(provider, /isPaddleCheckoutEnabled/);
  assert.match(provider, /Usable legacy Paddle subscription/);
});

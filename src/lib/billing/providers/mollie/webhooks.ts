import "server-only";

import { createHash } from "node:crypto";

import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import {
  createMollieSubscriptionAfterMandate,
  isMolliePaymentPaid,
  isMolliePaymentPending,
  isMolliePaymentTerminalFailure,
  isMollieSelfServePlanKey,
  mapMollieSubscriptionStatus,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import { finalizeMollieSubscriptionIfExpired, applyMollieUpgradeAfterPayment } from "@/lib/billing/providers/mollie/lifecycle";
import { resolveMollieStoredSubscriptionStatus } from "@/lib/billing/providers/mollie/lifecycle-status";
import {
  MOLLIE_METADATA_BILLING_SURFACE,
  MOLLIE_METADATA_ORGANIZATION_ID,
  MOLLIE_METADATA_PLAN_KEY,
} from "@/lib/billing/providers/mollie/foundation";
import { assertMolliePaymentOpsAllowed, assertMollieTestModeOnly } from "@/lib/billing/providers/mollie/mode";
import {
  applyMolliePendingPlanChangeIfReady,
  getMollieOrganizationSubscription,
  upsertMollieOrganizationSubscription,
} from "@/lib/billing/providers/mollie/organization-sync";
import { upsertMollieBillingTransaction } from "@/lib/billing/providers/mollie/transactions";
import {
  MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT,
  clearMollieUpgradePaymentAttempt,
} from "@/lib/billing/providers/mollie/upgrade-payment";
import { getPlanByKey } from "@/lib/billing/plans";
import {
  getMollieTestSubscriptionForOrg,
  upsertMollieTestSubscription,
} from "@/lib/billing/providers/mollie/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrganizationNameForBillingEmail,
  sendPlanChangeAppliedEmail,
  sendUpgradeActivatedEmail,
} from "@/lib/email/plan-change";
import { sendPurchaseActivatedEmail } from "@/lib/email/purchase";
import { sendSubscriptionEndedEmail } from "@/lib/email/subscription-management";
import { createMollieProductionSubscriptionAfterMandate } from "@/lib/billing/providers/mollie/production-checkout";

export type MollieIdempotencyStatus = "proceed" | "duplicate" | "retry" | "unavailable";

export type MollieIdempotencyResult = {
  status: MollieIdempotencyStatus;
};

const PROCESSING_STALE_MS = 5 * 60 * 1000;

function hashPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

export async function ensureMollieIdempotency(input: {
  providerEventId: string;
  eventType: string;
  rawBody: string;
}): Promise<MollieIdempotencyResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const payloadHash = hashPayload(input.rawBody);

  const { data: existing, error: readError } = await admin
    .from("mollie_webhook_events")
    .select("status, received_at, payload_hash")
    .eq("provider", "mollie")
    .eq("provider_event_id", input.providerEventId)
    .maybeSingle();

  if (readError) {
    console.error("[mollie] idempotency read failed:", {
      message: readError.message,
      eventType: input.eventType,
      providerEventIdPrefix: input.providerEventId.slice(0, 12),
    });
    return { status: "unavailable" };
  }

  const row = existing as {
    status: string;
    received_at?: string | null;
    payload_hash?: string | null;
  } | null;

  if (row?.payload_hash && row.payload_hash !== payloadHash) {
    console.error("[mollie] idempotency payload hash mismatch — rejecting", {
      eventType: input.eventType,
      providerEventIdPrefix: input.providerEventId.slice(0, 12),
    });
    return { status: "unavailable" };
  }

  if (row?.status === "processed" || row?.status === "duplicate" || row?.status === "ignored") {
    await admin
      .from("mollie_webhook_events")
      .update({ status: "duplicate" } as never)
      .eq("provider", "mollie")
      .eq("provider_event_id", input.providerEventId);
    return { status: "duplicate" };
  }

  if (row?.status === "failed") {
    const { data: claimed, error: claimError } = await admin
      .from("mollie_webhook_events")
      .update({
        status: "processing",
        last_error: null,
        payload_hash: payloadHash,
      } as never)
      .eq("provider", "mollie")
      .eq("provider_event_id", input.providerEventId)
      .eq("status", "failed")
      .select("provider_event_id")
      .maybeSingle();

    if (claimError || !claimed) {
      return claimError ? { status: "unavailable" } : { status: "duplicate" };
    }
    return { status: "retry" };
  }

  if (row?.status === "processing") {
    const receivedAtMs = row.received_at ? Date.parse(row.received_at) : Number.NaN;
    const isStale =
      Number.isFinite(receivedAtMs) && Date.now() - receivedAtMs >= PROCESSING_STALE_MS;

    if (!isStale) {
      return { status: "duplicate" };
    }

    const { data: claimed, error: claimError } = await admin
      .from("mollie_webhook_events")
      .update({
        status: "processing",
        last_error: null,
        payload_hash: payloadHash,
        received_at: now,
      } as never)
      .eq("provider", "mollie")
      .eq("provider_event_id", input.providerEventId)
      .eq("status", "processing")
      .select("provider_event_id")
      .maybeSingle();

    if (claimError || !claimed) {
      return claimError ? { status: "unavailable" } : { status: "duplicate" };
    }
    return { status: "retry" };
  }

  const { error: insertError } = await admin.from("mollie_webhook_events").insert({
    provider: "mollie",
    provider_event_id: input.providerEventId,
    event_type: input.eventType,
    received_at: now,
    status: "processing",
    payload_hash: payloadHash,
  } as never);

  if (insertError) {
    if (insertError.code === "23505") {
      return { status: "duplicate" };
    }
    return { status: "unavailable" };
  }

  return { status: "proceed" };
}

export async function markMollieEventProcessed(
  providerEventId: string,
  organizationId?: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("mollie_webhook_events")
    .update({
      status: "processed",
      processed_at: now,
      organization_id: organizationId ?? null,
      last_error: null,
    } as never)
    .eq("provider", "mollie")
    .eq("provider_event_id", providerEventId);
}

export async function markMollieEventIgnored(
  providerEventId: string,
  reason?: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("mollie_webhook_events")
    .update({
      status: "ignored",
      processed_at: now,
      last_error: reason ? reason.slice(0, 500) : null,
    } as never)
    .eq("provider", "mollie")
    .eq("provider_event_id", providerEventId);
}

export async function markMollieEventFailed(
  providerEventId: string,
  errorMessage: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("mollie_webhook_events")
    .update({
      status: "failed",
      last_error: errorMessage.slice(0, 500),
    } as never)
    .eq("provider", "mollie")
    .eq("provider_event_id", providerEventId);
}

function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export type MollieWebhookReconcileResult = {
  handled: boolean;
  ignored: boolean;
  organizationId: string | null;
  reason?: string;
  surface?: "test" | "production";
};

function resolveBillingSurface(
  metadata: Record<string, unknown> | null | undefined,
): "test" | "production" {
  const surface = readMetadataString(metadata, MOLLIE_METADATA_BILLING_SURFACE);
  return surface === "production" ? "production" : "test";
}

function readBillingPurpose(metadata: Record<string, unknown> | null | undefined): string | null {
  const value = metadata?.auroranexis_billing_purpose;
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parsePaymentAmountCents(amountValue: string | undefined): number | null {
  if (!amountValue) {
    return null;
  }
  const parsed = Number.parseFloat(amountValue);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed * 100);
}

async function recordMolliePaidTransaction(input: {
  organizationId: string;
  paymentId: string;
  customerId: string | null;
  subscriptionId: string | null;
  planKey: string | null;
  amountValue: string | undefined;
  currency: string | undefined;
  paidAt: string;
  productName: string;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  invoiceUrl?: string | null;
}): Promise<void> {
  await upsertMollieBillingTransaction({
    organizationId: input.organizationId,
    providerTransactionId: input.paymentId,
    providerCustomerId: input.customerId,
    providerSubscriptionId: input.subscriptionId,
    providerPriceId: input.planKey,
    status: "paid",
    amountTotal: parsePaymentAmountCents(input.amountValue),
    currency: input.currency ?? "eur",
    occurredAt: input.paidAt,
    paidAt: input.paidAt,
    invoiceUrl: input.invoiceUrl ?? null,
    productName: input.productName,
    billingPeriodStart: input.billingPeriodStart ?? null,
    billingPeriodEnd: input.billingPeriodEnd ?? null,
  });
}

async function reconcileMollieUpgradePayment(
  paymentId: string,
  organizationId: string,
  payment: {
    status: string;
    customerId?: string | null;
    subscriptionId?: string | null;
    amount?: { value?: string; currency?: string } | null;
    metadata?: unknown;
    _links?: { checkout?: { href?: string } };
  },
): Promise<MollieWebhookReconcileResult> {
  const metadata =
    payment.metadata && typeof payment.metadata === "object"
      ? (payment.metadata as Record<string, unknown>)
      : null;
  const targetPlanRaw = readMetadataString(metadata, MOLLIE_METADATA_PLAN_KEY);
  const subscriptionIdRaw = metadata?.auroranexis_provider_subscription_id;
  const subscriptionId =
    typeof subscriptionIdRaw === "string" && subscriptionIdRaw.startsWith("sub_")
      ? subscriptionIdRaw
      : payment.subscriptionId?.startsWith("sub_")
        ? payment.subscriptionId
        : null;

  if (!targetPlanRaw || !isMollieSelfServePlanKey(targetPlanRaw) || !subscriptionId) {
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "invalid_upgrade_metadata",
      surface: "production",
    };
  }

  if (isMolliePaymentTerminalFailure(payment.status)) {
    await clearMollieUpgradePaymentAttempt(organizationId);
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "upgrade_payment_failed",
      surface: "production",
    };
  }

  if (!isMolliePaymentPaid(payment.status)) {
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "upgrade_payment_pending",
      surface: "production",
    };
  }

  const paidAt = new Date().toISOString();
  const upgradeResult = await applyMollieUpgradeAfterPayment({
    organizationId,
    paymentId,
    targetPlanKey: targetPlanRaw,
    providerSubscriptionId: subscriptionId,
  });

  const targetPlan = getPlanByKey(targetPlanRaw);
  await recordMolliePaidTransaction({
    organizationId,
    paymentId,
    customerId: payment.customerId ?? null,
    subscriptionId,
    planKey: targetPlanRaw,
    amountValue: payment.amount?.value,
    currency: payment.amount?.currency,
    paidAt,
    productName: `Upgrade adjustment — ${targetPlan.name}`,
  });

  if (
    upgradeResult.applied &&
    upgradeResult.previousPlanKey &&
    upgradeResult.appliedPlanKey &&
    upgradeResult.providerChangeReference
  ) {
    void getOrganizationNameForBillingEmail(organizationId)
      .then((organizationName) =>
        sendUpgradeActivatedEmail({
          organizationId,
          organizationName,
          previousPlanKey: upgradeResult.previousPlanKey!,
          appliedPlanKey: upgradeResult.appliedPlanKey!,
          providerChangeReference: upgradeResult.providerChangeReference!,
          receiptUrl: payment._links?.checkout?.href ?? null,
        }),
      )
      .catch((emailError) => {
        console.error("[billing][upgrade] activated email failed", {
          organizationId,
          message: emailError instanceof Error ? emailError.message : String(emailError),
        });
      });
  }

  return { handled: true, ignored: false, organizationId, surface: "production" };
}

/**
 * Phase 2 isolated TEST reconcile — writes mollie_test_subscriptions only.
 * Never mutates organization_subscriptions.
 */
async function reconcileMollieTestPaymentWebhook(
  paymentId: string,
): Promise<MollieWebhookReconcileResult> {
  assertMollieTestModeOnly();

  const client = createMollieBillingClient();
  const payment = await client.payments.get(paymentId);

  const organizationId = readMetadataString(
    payment.metadata as Record<string, unknown> | null,
    MOLLIE_METADATA_ORGANIZATION_ID,
  );
  const planKeyRaw = readMetadataString(
    payment.metadata as Record<string, unknown> | null,
    MOLLIE_METADATA_PLAN_KEY,
  );

  if (!organizationId) {
    return {
      handled: true,
      ignored: true,
      organizationId: null,
      reason: "missing_organization_metadata",
      surface: "test",
    };
  }

  const testRow = await getMollieTestSubscriptionForOrg(organizationId);
  const paymentCustomerId = payment.customerId ?? null;

  if (testRow?.provider_customer_id && paymentCustomerId) {
    if (testRow.provider_customer_id !== paymentCustomerId) {
      console.error("[mollie] payment customer mismatch — rejecting", {
        organizationIdPrefix: organizationId.slice(0, 8),
        paymentIdPrefix: paymentId.slice(0, 8),
      });
      return {
        handled: true,
        ignored: true,
        organizationId,
        reason: "customer_ownership_mismatch",
        surface: "test",
      };
    }
  }

  if (isMolliePaymentPending(payment.status)) {
    await upsertMollieTestSubscription({
      organization_id: organizationId,
      plan_key:
        planKeyRaw && isMollieSelfServePlanKey(planKeyRaw)
          ? planKeyRaw
          : (testRow?.plan_key ?? "professional"),
      provider_customer_id: paymentCustomerId ?? testRow?.provider_customer_id ?? null,
      first_payment_id: payment.id,
      provider_status: payment.status,
      status: "incomplete",
      sync_pending: true,
    });
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "payment_pending",
      surface: "test",
    };
  }

  if (isMolliePaymentTerminalFailure(payment.status)) {
    await upsertMollieTestSubscription({
      organization_id: organizationId,
      plan_key:
        planKeyRaw && isMollieSelfServePlanKey(planKeyRaw)
          ? planKeyRaw
          : (testRow?.plan_key ?? "professional"),
      provider_customer_id: paymentCustomerId ?? testRow?.provider_customer_id ?? null,
      first_payment_id: payment.id,
      provider_status: payment.status,
      status: "inactive",
      sync_pending: false,
      last_reconciled_at: new Date().toISOString(),
    });
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "payment_failed",
      surface: "test",
    };
  }

  if (!isMolliePaymentPaid(payment.status)) {
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "unhandled_payment_status",
      surface: "test",
    };
  }

  const planKey: MollieSelfServePlanKey =
    planKeyRaw && isMollieSelfServePlanKey(planKeyRaw)
      ? planKeyRaw
      : testRow?.plan_key && isMollieSelfServePlanKey(testRow.plan_key)
        ? testRow.plan_key
        : "professional";

  const customerId = paymentCustomerId ?? testRow?.provider_customer_id;
  if (!customerId?.startsWith("cst_")) {
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "missing_customer",
      surface: "test",
    };
  }

  const existingSubscriptionId =
    (payment.subscriptionId?.startsWith("sub_") ? payment.subscriptionId : null) ??
    (testRow?.provider_subscription_id?.startsWith("sub_")
      ? testRow.provider_subscription_id
      : null);

  if (existingSubscriptionId) {
    const subscription = await client.customerSubscriptions.get(existingSubscriptionId, {
      customerId,
    });

    if (subscription.id !== existingSubscriptionId) {
      return {
        handled: true,
        ignored: true,
        organizationId,
        reason: "subscription_verification_failed",
        surface: "test",
      };
    }

    await upsertMollieTestSubscription({
      organization_id: organizationId,
      plan_key: planKey,
      provider_customer_id: customerId,
      provider_subscription_id: subscription.id,
      first_payment_id: testRow?.first_payment_id ?? payment.id,
      ...(testRow?.mandate_id ? { mandate_id: testRow.mandate_id } : {}),
      provider_price_id: planKey,
      provider_status: subscription.status,
      status: mapMollieSubscriptionStatus(subscription.status),
      sync_pending: false,
      last_reconciled_at: new Date().toISOString(),
    });

    return { handled: true, ignored: false, organizationId, surface: "test" };
  }

  if (payment.sequenceType === "first" || testRow?.first_payment_id === payment.id) {
    await upsertMollieTestSubscription({
      organization_id: organizationId,
      plan_key: planKey,
      provider_customer_id: customerId,
      first_payment_id: payment.id,
      provider_price_id: planKey,
      provider_status: payment.status,
      status: "active",
      sync_pending: true,
      last_reconciled_at: new Date().toISOString(),
    });

    await createMollieSubscriptionAfterMandate({
      organizationId,
      customerId,
      planKey,
      paymentId: payment.id,
    });

    return { handled: true, ignored: false, organizationId, surface: "test" };
  }

  return {
    handled: true,
    ignored: true,
    organizationId,
    reason: "unmapped_payment",
    surface: "test",
  };
}

/**
 * Phase 3 production reconcile — writes organization_subscriptions only.
 * Never mutates FastSpring rows (organization-sync guards) and never writes
 * mollie_test_subscriptions.
 */
async function reconcileMollieProductionPaymentWebhook(
  paymentId: string,
): Promise<MollieWebhookReconcileResult> {
  assertMolliePaymentOpsAllowed();

  const client = createMollieBillingClient();
  const payment = await client.payments.get(paymentId);

  const organizationId = readMetadataString(
    payment.metadata as Record<string, unknown> | null,
    MOLLIE_METADATA_ORGANIZATION_ID,
  );
  const planKeyRaw = readMetadataString(
    payment.metadata as Record<string, unknown> | null,
    MOLLIE_METADATA_PLAN_KEY,
  );

  if (!organizationId) {
    return {
      handled: true,
      ignored: true,
      organizationId: null,
      reason: "missing_organization_metadata",
      surface: "production",
    };
  }

  const billingPurpose = readBillingPurpose(payment.metadata as Record<string, unknown> | null);
  if (billingPurpose === MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT) {
    return reconcileMollieUpgradePayment(paymentId, organizationId, payment);
  }

  const orgRow = await getMollieOrganizationSubscription(organizationId);
  const paymentCustomerId = payment.customerId ?? null;

  if (orgRow?.provider_customer_id && paymentCustomerId) {
    if (orgRow.provider_customer_id !== paymentCustomerId) {
      console.error("[mollie] production payment customer mismatch — rejecting", {
        organizationIdPrefix: organizationId.slice(0, 8),
        paymentIdPrefix: paymentId.slice(0, 8),
      });
      return {
        handled: true,
        ignored: true,
        organizationId,
        reason: "customer_ownership_mismatch",
        surface: "production",
      };
    }
  }

  const planKey: MollieSelfServePlanKey =
    planKeyRaw && isMollieSelfServePlanKey(planKeyRaw)
      ? planKeyRaw
      : orgRow?.provider_price_id && isMollieSelfServePlanKey(orgRow.provider_price_id)
        ? orgRow.provider_price_id
        : "professional";

  if (isMolliePaymentPending(payment.status)) {
    await upsertMollieOrganizationSubscription({
      organizationId,
      providerCustomerId: paymentCustomerId ?? orgRow?.provider_customer_id ?? null,
      providerSubscriptionId: orgRow?.provider_subscription_id ?? null,
      planKey,
      providerStatus: payment.status,
      normalizedStatus: "incomplete",
      syncPending: true,
    });
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "payment_pending",
      surface: "production",
    };
  }

  if (isMolliePaymentTerminalFailure(payment.status)) {
    const failedPlanKey: MollieSelfServePlanKey =
      orgRow?.provider_price_id && isMollieSelfServePlanKey(orgRow.provider_price_id)
        ? orgRow.provider_price_id
        : planKey;
    await upsertMollieOrganizationSubscription({
      organizationId,
      providerCustomerId: paymentCustomerId ?? orgRow?.provider_customer_id ?? null,
      providerSubscriptionId: orgRow?.provider_subscription_id ?? null,
      planKey: failedPlanKey,
      providerStatus: payment.status,
      normalizedStatus: payment.subscriptionId ? "past_due" : "inactive",
      syncPending: false,
    });
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "payment_failed",
      surface: "production",
    };
  }

  if (!isMolliePaymentPaid(payment.status)) {
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "unhandled_payment_status",
      surface: "production",
    };
  }

  const customerId = paymentCustomerId ?? orgRow?.provider_customer_id;
  if (!customerId?.startsWith("cst_")) {
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "missing_customer",
      surface: "production",
    };
  }

  const existingSubscriptionId =
    (payment.subscriptionId?.startsWith("sub_") ? payment.subscriptionId : null) ??
    (orgRow?.provider_subscription_id?.startsWith("sub_")
      ? orgRow.provider_subscription_id
      : null);

  if (existingSubscriptionId) {
    const subscription = await client.customerSubscriptions.get(existingSubscriptionId, {
      customerId,
    });

    if (subscription.id !== existingSubscriptionId) {
      return {
        handled: true,
        ignored: true,
        organizationId,
        reason: "subscription_verification_failed",
        surface: "production",
      };
    }

    const nextPaymentDate =
      typeof subscription.nextPaymentDate === "string" ? subscription.nextPaymentDate : null;

    // Recurring/paid confirmation: apply scheduled pending_plan if present.
    // Authoritative provider_price_id stays on the previous plan until this path runs.
    const pendingApply = await applyMolliePendingPlanChangeIfReady({
      organizationId,
      providerCustomerId: customerId,
      providerSubscriptionId: subscription.id,
      providerStatus: subscription.status,
      normalizedStatus: resolveMollieStoredSubscriptionStatus({
        providerStatus: subscription.status,
        cancelAtPeriodEnd: orgRow?.cancel_at_period_end ?? false,
        currentPeriodEnd: nextPaymentDate,
      }),
      currentPeriodEnd: nextPaymentDate,
    });

    if (
      pendingApply.applied &&
      pendingApply.planKey &&
      pendingApply.previousPlanKey &&
      pendingApply.changeType &&
      pendingApply.providerChangeReference
    ) {
      void getOrganizationNameForBillingEmail(organizationId)
        .then((organizationName) =>
          sendPlanChangeAppliedEmail({
            organizationId,
            organizationName,
            previousPlanKey: pendingApply.previousPlanKey!,
            appliedPlanKey: pendingApply.planKey!,
            changeType: pendingApply.changeType!,
            providerChangeReference: pendingApply.providerChangeReference!,
          }),
        )
        .catch((emailError) => {
          console.error("[billing][plan-change] applied email failed", {
            organizationId,
            message: emailError instanceof Error ? emailError.message : String(emailError),
          });
        });
    }

    if (!pendingApply.applied) {
      const authoritativePlanKey =
        pendingApply.planKey ??
        (orgRow?.provider_price_id && isMollieSelfServePlanKey(orgRow.provider_price_id)
          ? orgRow.provider_price_id
          : planKey);

      await upsertMollieOrganizationSubscription({
        organizationId,
        providerCustomerId: customerId,
        providerSubscriptionId: subscription.id,
        planKey: authoritativePlanKey,
        providerStatus: subscription.status,
        normalizedStatus: resolveMollieStoredSubscriptionStatus({
          providerStatus: subscription.status,
          cancelAtPeriodEnd: orgRow?.cancel_at_period_end ?? false,
          currentPeriodEnd: nextPaymentDate,
        }),
        syncPending: false,
        currentPeriodStart: orgRow?.current_period_end ?? orgRow?.current_period_start ?? new Date().toISOString(),
        currentPeriodEnd: nextPaymentDate,
      });
    }

    const expired = await finalizeMollieSubscriptionIfExpired({ organizationId });
    if (
      expired.expired &&
      expired.providerSubscriptionId &&
      expired.planKey
    ) {
      void sendSubscriptionEndedEmail({
        organizationId,
        planKey: expired.planKey,
        accessUntil: expired.accessUntil,
        providerSubscriptionId: expired.providerSubscriptionId,
      }).catch((emailError) => {
        console.error("[billing][subscription-expire] ended email failed", {
          organizationId,
          message: emailError instanceof Error ? emailError.message : String(emailError),
        });
      });
    }

    const paidAt = new Date().toISOString();
    const renewalPlanKey =
      pendingApply.planKey ??
      (orgRow?.provider_price_id && isMollieSelfServePlanKey(orgRow.provider_price_id)
        ? orgRow.provider_price_id
        : planKey);
    const renewalPlan = getPlanByKey(renewalPlanKey);
    await recordMolliePaidTransaction({
      organizationId,
      paymentId: payment.id,
      customerId,
      subscriptionId: subscription.id,
      planKey: renewalPlanKey,
      amountValue: payment.amount?.value,
      currency: payment.amount?.currency,
      paidAt,
      productName: `${renewalPlan.name} renewal`,
      billingPeriodStart: orgRow?.current_period_start ?? null,
      billingPeriodEnd: nextPaymentDate,
      invoiceUrl: payment._links?.checkout?.href ?? null,
    });

    return { handled: true, ignored: false, organizationId, surface: "production" };
  }

  if (payment.sequenceType === "first") {
    await upsertMollieOrganizationSubscription({
      organizationId,
      providerCustomerId: customerId,
      providerSubscriptionId: null,
      planKey,
      providerStatus: payment.status,
      normalizedStatus: "incomplete",
      syncPending: true,
    });

    const subscriptionResult = await createMollieProductionSubscriptionAfterMandate({
      organizationId,
      customerId,
      planKey,
      paymentId: payment.id,
    });

    const paidAt = new Date().toISOString();
    const purchasePlan = getPlanByKey(planKey);
    await recordMolliePaidTransaction({
      organizationId,
      paymentId: payment.id,
      customerId,
      subscriptionId: subscriptionResult.subscriptionId,
      planKey,
      amountValue: payment.amount?.value,
      currency: payment.amount?.currency,
      paidAt,
      productName: `${purchasePlan.name} subscription`,
      invoiceUrl: payment._links?.checkout?.href ?? null,
    });

    void getOrganizationNameForBillingEmail(organizationId)
      .then((organizationName) =>
        sendPurchaseActivatedEmail({
          organizationId,
          organizationName,
          planKey,
          providerSubscriptionId: subscriptionResult.subscriptionId,
          providerPaymentId: payment.id,
          receiptUrl: payment._links?.checkout?.href ?? null,
        }),
      )
      .catch((emailError) => {
        console.error("[billing][purchase] activation email failed", {
          organizationId,
          message: emailError instanceof Error ? emailError.message : String(emailError),
        });
      });

    return { handled: true, ignored: false, organizationId, surface: "production" };
  }

  return {
    handled: true,
    ignored: true,
    organizationId,
    reason: "unmapped_payment",
    surface: "production",
  };
}

/**
 * Authoritative payment re-fetch + relationship validation.
 * Never trust webhook body alone beyond extracting the payment id.
 * Routes by auroranexis_billing_surface metadata (production vs test).
 */
export async function reconcileMolliePaymentWebhook(
  paymentId: string,
): Promise<MollieWebhookReconcileResult> {
  assertMolliePaymentOpsAllowed();

  const client = createMollieBillingClient();
  const payment = await client.payments.get(paymentId);
  const surface = resolveBillingSurface(payment.metadata as Record<string, unknown> | null);

  if (surface === "production") {
    return reconcileMollieProductionPaymentWebhook(paymentId);
  }

  return reconcileMollieTestPaymentWebhook(paymentId);
}

export function extractMollieWebhookPaymentId(rawBody: string): string | null {
  const trimmed = rawBody.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed) as { id?: unknown };
      return typeof json.id === "string" && json.id.startsWith("tr_") ? json.id : null;
    } catch {
      return null;
    }
  }

  const params = new URLSearchParams(trimmed);
  const id = params.get("id");
  return id?.startsWith("tr_") ? id : null;
}

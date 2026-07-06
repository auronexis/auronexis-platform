import { recordActivityEvent } from "@/lib/activity/record";
import { recordBillingEvent, syncCustomerInvoiceFromStripe } from "@/lib/billing/invoices";
import { createNotificationForOwnersAndAdmins } from "@/lib/notifications/create";
import { applyCheckoutSessionToOrganization } from "@/lib/stripe/checkout-sync";
import { getOrganizationIdByStripeCustomerId } from "@/lib/stripe/customers";
import { getStripeClient } from "@/lib/stripe/client";
import {
  markOrganizationSubscriptionCancelled,
  syncOrganizationPlan,
  upsertOrganizationSubscription,
} from "@/lib/stripe/subscriptions";
import {
  mapStripeSubscription,
  resolveOrganizationIdFromMetadata,
} from "@/lib/stripe/types";
import type Stripe from "stripe";

async function resolveOrganizationId(
  organizationId: string | null,
  stripeCustomerId: string | null,
): Promise<string | null> {
  if (organizationId) return organizationId;
  if (stripeCustomerId) return getOrganizationIdByStripeCustomerId(stripeCustomerId);
  return null;
}

async function recordBillingActivity(input: {
  organizationId: string;
  action: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await recordActivityEvent({
    organizationId: input.organizationId,
    actorUserId: null,
    entityType: "organization",
    entityId: input.organizationId,
    action: input.action,
    title: input.title,
    description: input.description,
    metadata: {
      automated: true,
      ...input.metadata,
    },
  });
}

async function notifyOwnersAndAdmins(
  organizationId: string,
  input: {
    type:
      | "subscription_activated"
      | "subscription_payment_failed"
      | "subscription_cancelled"
      | "subscription_trial_ending"
      | "invoice_paid"
      | "invoice_failed";
    title: string;
    message: string;
  },
): Promise<void> {
  await createNotificationForOwnersAndAdmins(organizationId, {
    type: input.type,
    title: input.title,
    message: input.message,
    entityType: "organization",
    entityId: organizationId,
  });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  stripeEventId: string,
): Promise<void> {
  const organizationId = await applyCheckoutSessionToOrganization(session);
  if (!organizationId) return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const stripe = getStripeClient();
  const subscription = subscriptionId
    ? await stripe.subscriptions.retrieve(subscriptionId)
    : null;

  await recordBillingActivity({
    organizationId,
    action: "subscription_created",
    title: "Subscription activated",
    description: "A paid subscription was activated via Stripe Checkout.",
    metadata: {
      stripeSubscriptionId: subscriptionId,
      status: subscription?.status ?? session.payment_status,
    },
  });

  await recordBillingEvent({
    organizationId,
    eventType: "checkout_completed",
    stripeEventId,
    payload: {
      subscriptionId,
      status: subscription?.status ?? session.payment_status,
      checkoutSessionId: session.id,
    },
  });

  await notifyOwnersAndAdmins(organizationId, {
    type: "subscription_activated",
    title: "Subscription activated",
    message: "Your organization subscription is now active.",
  });
}

async function handleSubscriptionUpsert(
  subscription: Stripe.Subscription,
  eventType: Stripe.Event.Type,
  stripeEventId: string,
): Promise<void> {
  const organizationId = await resolveOrganizationId(
    resolveOrganizationIdFromMetadata(subscription.metadata),
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null,
  );

  if (!organizationId) {
    console.error("[stripe] subscription event missing organization_id");
    return;
  }

  await upsertOrganizationSubscription(mapStripeSubscription(organizationId, subscription));
  await syncOrganizationPlan(organizationId, subscription.status);

  await recordBillingEvent({
    organizationId,
    eventType: eventType.replace("customer.", ""),
    stripeEventId,
    payload: {
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  if (eventType === "customer.subscription.updated") {
    await recordBillingActivity({
      organizationId,
      action: "subscription_updated",
      title: "Subscription updated",
      description: `Subscription status changed to ${subscription.status}.`,
      metadata: {
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    if (subscription.status === "canceled") {
      await notifyOwnersAndAdmins(organizationId, {
        type: "subscription_cancelled",
        title: "Subscription cancelled",
        message: "Your organization subscription has been cancelled.",
      });
    }
  }

  if (subscription.status === "trialing" && subscription.trial_end) {
    const trialEndsAt = new Date(subscription.trial_end * 1000);
    const daysRemaining = Math.ceil(
      (trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    if (daysRemaining <= 3 && daysRemaining >= 0) {
      await notifyOwnersAndAdmins(organizationId, {
        type: "subscription_trial_ending",
        title: "Trial ending soon",
        message: `Your trial ends in ${daysRemaining} day(s). Add a payment method to continue service.`,
      });
    }
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  stripeEventId: string,
): Promise<void> {
  const organizationId = await resolveOrganizationId(
    resolveOrganizationIdFromMetadata(subscription.metadata),
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null,
  );

  if (!organizationId) {
    console.error("[stripe] subscription.deleted missing organization_id");
    return;
  }

  await markOrganizationSubscriptionCancelled(organizationId);
  await syncOrganizationPlan(organizationId, "canceled");

  await recordBillingEvent({
    organizationId,
    eventType: "subscription_deleted",
    stripeEventId,
    payload: { subscriptionId: subscription.id },
  });

  await recordBillingActivity({
    organizationId,
    action: "subscription_cancelled",
    title: "Subscription cancelled",
    description: "The organization subscription was cancelled in Stripe.",
    metadata: {
      stripeSubscriptionId: subscription.id,
    },
  });

  await notifyOwnersAndAdmins(organizationId, {
    type: "subscription_cancelled",
    title: "Subscription cancelled",
    message: "Your organization subscription has been cancelled.",
  });
}

async function syncInvoiceWithSubscription(
  invoice: Stripe.Invoice,
): Promise<{ organizationId: string; subscriptionId: string } | null> {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id ?? null;

  if (!subscriptionId) return null;

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const organizationId = await resolveOrganizationId(
    resolveOrganizationIdFromMetadata(subscription.metadata),
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null,
  );

  if (!organizationId) return null;

  await upsertOrganizationSubscription(mapStripeSubscription(organizationId, subscription));
  await syncOrganizationPlan(organizationId, subscription.status);
  await syncCustomerInvoiceFromStripe(organizationId, invoice);

  return { organizationId, subscriptionId };
}

async function handleInvoiceFinalized(
  invoice: Stripe.Invoice,
  stripeEventId: string,
): Promise<void> {
  const result = await syncInvoiceWithSubscription(invoice);
  if (!result) return;

  await recordBillingEvent({
    organizationId: result.organizationId,
    eventType: "invoice_finalized",
    stripeEventId,
    payload: { invoiceId: invoice.id, amountDue: invoice.amount_due },
  });
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  stripeEventId: string,
): Promise<void> {
  const result = await syncInvoiceWithSubscription(invoice);
  if (!result) return;

  await recordBillingActivity({
    organizationId: result.organizationId,
    action: "subscription_payment_succeeded",
    title: "Subscription payment succeeded",
    description: "A subscription invoice was paid successfully.",
    metadata: {
      stripeSubscriptionId: result.subscriptionId,
      invoiceId: invoice.id,
    },
  });

  await recordBillingEvent({
    organizationId: result.organizationId,
    eventType: "invoice_paid",
    stripeEventId,
    payload: { invoiceId: invoice.id, amountPaid: invoice.amount_paid },
  });

  await notifyOwnersAndAdmins(result.organizationId, {
    type: "invoice_paid",
    title: "Invoice paid",
    message: "Your subscription invoice was paid successfully.",
  });
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  stripeEventId: string,
): Promise<void> {
  const result = await syncInvoiceWithSubscription(invoice);
  if (!result) return;

  await recordBillingActivity({
    organizationId: result.organizationId,
    action: "subscription_payment_failed",
    title: "Subscription payment failed",
    description: "A subscription invoice payment failed.",
    metadata: {
      stripeSubscriptionId: result.subscriptionId,
      invoiceId: invoice.id,
    },
  });

  await recordBillingEvent({
    organizationId: result.organizationId,
    eventType: "invoice_failed",
    stripeEventId,
    payload: { invoiceId: invoice.id, amountDue: invoice.amount_due },
  });

  await notifyOwnersAndAdmins(result.organizationId, {
    type: "subscription_payment_failed",
    title: "Payment failed",
    message: "Your subscription payment failed. Update your payment method in the billing portal.",
  });

  await notifyOwnersAndAdmins(result.organizationId, {
    type: "invoice_failed",
    title: "Invoice payment failed",
    message: "An invoice payment failed. Review billing in the customer portal.",
  });
}

/** Process a verified Stripe webhook event. Returns false for unsupported event types. */
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<boolean> {
  const stripeEventId = event.id;

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
        stripeEventId,
      );
      return true;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(
        event.data.object as Stripe.Subscription,
        event.type,
        stripeEventId,
      );
      return true;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, stripeEventId);
      return true;

    case "invoice.finalized":
      await handleInvoiceFinalized(event.data.object as Stripe.Invoice, stripeEventId);
      return true;

    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, stripeEventId);
      return true;

    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, stripeEventId);
      return true;

    default:
      return false;
  }
}
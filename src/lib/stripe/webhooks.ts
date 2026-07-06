import { recordActivityEvent } from "@/lib/activity/record";
import { recordBillingEvent, syncCustomerInvoiceFromStripe } from "@/lib/billing/invoices";
import { createNotificationForOwnersAndAdmins } from "@/lib/notifications/create";
import { applyCheckoutSessionToOrganization } from "@/lib/stripe/checkout-sync";
import { getOrganizationIdByStripeCustomerId, ensureSubscriptionCustomer } from "@/lib/stripe/customers";
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

function logWebhookHandler(eventType: string, note: string, extra?: Record<string, unknown>): void {
  console.info("[stripe][webhook]", { eventType, note, ...extra });
}

function logWebhookHandlerWarning(
  eventType: string,
  note: string,
  extra?: Record<string, unknown>,
): void {
  console.warn("[stripe][webhook]", { eventType, note, ...extra });
}

async function resolveOrganizationId(
  organizationId: string | null,
  stripeCustomerId: string | null,
): Promise<string | null> {
  if (organizationId) return organizationId;
  if (stripeCustomerId) return getOrganizationIdByStripeCustomerId(stripeCustomerId);
  return null;
}

function getInvoiceCustomerId(invoice: Stripe.Invoice): string | null {
  return typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSubscription === "string") return parentSubscription;
  if (parentSubscription?.id) return parentSubscription.id;

  const legacyInvoice = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  if (typeof legacyInvoice.subscription === "string") return legacyInvoice.subscription;
  if (legacyInvoice.subscription?.id) return legacyInvoice.subscription.id;

  return null;
}

async function recordBillingActivity(input: {
  organizationId: string;
  action: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
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
  } catch (error) {
    logWebhookHandlerWarning("activity", "failed to record billing activity", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
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
  try {
    await createNotificationForOwnersAndAdmins(organizationId, {
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: "organization",
      entityId: organizationId,
    });
  } catch (error) {
    logWebhookHandlerWarning("notification", "failed to notify owners/admins", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function safeRecordBillingEvent(input: Parameters<typeof recordBillingEvent>[0]): Promise<void> {
  try {
    await recordBillingEvent(input);
  } catch (error) {
    logWebhookHandlerWarning(input.eventType, "failed to record billing event", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  stripeEventId: string,
): Promise<void> {
  const organizationId = await applyCheckoutSessionToOrganization(session);
  if (!organizationId) {
    logWebhookHandlerWarning("checkout.session.completed", "missing organization mapping");
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  let subscriptionStatus: string | null = session.payment_status ?? null;

  if (subscriptionId) {
    try {
      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      subscriptionStatus = subscription.status ?? subscriptionStatus;
    } catch (error) {
      logWebhookHandlerWarning("checkout.session.completed", "subscription retrieve skipped", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await recordBillingActivity({
    organizationId,
    action: "subscription_created",
    title: "Subscription activated",
    description: "A paid subscription was activated via Stripe Checkout.",
    metadata: {
      stripeSubscriptionId: subscriptionId,
      status: subscriptionStatus,
    },
  });

  await safeRecordBillingEvent({
    organizationId,
    eventType: "checkout_completed",
    stripeEventId,
    payload: {
      subscriptionId,
      status: subscriptionStatus,
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
    logWebhookHandlerWarning(eventType, "subscription event missing organization_id");
    return;
  }

  try {
    await upsertOrganizationSubscription(mapStripeSubscription(organizationId, subscription));
    await syncOrganizationPlan(organizationId, subscription.status);
    await ensureSubscriptionCustomer({
      organizationId,
      status: subscription.status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerIdHint:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id ?? null,
    });
  } catch (error) {
    logWebhookHandlerWarning(eventType, "subscription sync failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  await safeRecordBillingEvent({
    organizationId,
    eventType: eventType.replace("customer.", ""),
    stripeEventId,
    payload: {
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
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
    logWebhookHandlerWarning("customer.subscription.deleted", "missing organization_id");
    return;
  }

  try {
    await markOrganizationSubscriptionCancelled(organizationId);
    await syncOrganizationPlan(organizationId, "canceled");
  } catch (error) {
    logWebhookHandlerWarning("customer.subscription.deleted", "cancel sync failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  await safeRecordBillingEvent({
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
    metadata: { stripeSubscriptionId: subscription.id },
  });

  await notifyOwnersAndAdmins(organizationId, {
    type: "subscription_cancelled",
    title: "Subscription cancelled",
    message: "Your organization subscription has been cancelled.",
  });
}

async function syncInvoiceWithSubscription(
  invoice: Stripe.Invoice,
): Promise<{ organizationId: string; subscriptionId: string | null } | null> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  const customerId = getInvoiceCustomerId(invoice);

  if (subscriptionId) {
    try {
      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const organizationId = await resolveOrganizationId(
        resolveOrganizationIdFromMetadata(subscription.metadata),
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id ?? customerId,
      );

      if (!organizationId) return null;

      await upsertOrganizationSubscription(mapStripeSubscription(organizationId, subscription));
      await syncOrganizationPlan(organizationId, subscription.status);
      await syncCustomerInvoiceFromStripe(organizationId, invoice);

      return { organizationId, subscriptionId };
    } catch (error) {
      logWebhookHandlerWarning("invoice", "subscription-linked sync failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  const organizationId = await resolveOrganizationId(null, customerId);
  if (!organizationId) return null;

  try {
    await syncCustomerInvoiceFromStripe(organizationId, invoice);
  } catch (error) {
    logWebhookHandlerWarning("invoice", "customer-only invoice sync failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }

  return { organizationId, subscriptionId: null };
}

async function handleInvoiceEvent(
  invoice: Stripe.Invoice,
  stripeEventId: string,
  eventType: string,
): Promise<void> {
  if (!invoice.id) {
    logWebhookHandlerWarning(eventType, "invoice missing id");
    return;
  }

  const result = await syncInvoiceWithSubscription(invoice);
  if (!result) {
    logWebhookHandlerWarning(eventType, "invoice sync skipped — no organization mapping");
    return;
  }

  if (eventType === "invoice.created" || eventType === "invoice.finalized") {
    await safeRecordBillingEvent({
      organizationId: result.organizationId,
      eventType: eventType === "invoice.created" ? "invoice_created" : "invoice_finalized",
      stripeEventId,
      payload: { invoiceId: invoice.id, amountDue: invoice.amount_due ?? 0 },
    });
    return;
  }

  if (eventType === "invoice.paid" || eventType === "invoice.payment_succeeded") {
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

    await safeRecordBillingEvent({
      organizationId: result.organizationId,
      eventType: "invoice_paid",
      stripeEventId,
      payload: { invoiceId: invoice.id, amountPaid: invoice.amount_paid ?? 0 },
    });

    await notifyOwnersAndAdmins(result.organizationId, {
      type: "invoice_paid",
      title: "Invoice paid",
      message: "Your subscription invoice was paid successfully.",
    });
    return;
  }

  if (eventType === "invoice.payment_failed") {
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

    await safeRecordBillingEvent({
      organizationId: result.organizationId,
      eventType: "invoice_failed",
      stripeEventId,
      payload: { invoiceId: invoice.id, amountDue: invoice.amount_due ?? 0 },
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
}

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<boolean> {
  const stripeEventId = event.id;
  const eventType = event.type;

  switch (eventType) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
        stripeEventId,
      );
      logWebhookHandler(eventType, "processed");
      return true;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(
        event.data.object as Stripe.Subscription,
        eventType,
        stripeEventId,
      );
      logWebhookHandler(eventType, "processed");
      return true;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, stripeEventId);
      logWebhookHandler(eventType, "processed");
      return true;

    case "invoice.created":
    case "invoice.finalized":
    case "invoice.paid":
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
      await handleInvoiceEvent(event.data.object as Stripe.Invoice, stripeEventId, eventType);
      logWebhookHandler(eventType, "processed");
      return true;

    default:
      return false;
  }
}

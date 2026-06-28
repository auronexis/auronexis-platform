import { NextResponse } from "next/server";
import { getStripeWebhookSecret } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe/client";
import {
  ensureStripeIdempotency,
  markStripeEventFailed,
  markStripeEventProcessed,
} from "@/lib/stripe/idempotency";
import { handleStripeWebhookEvent } from "@/lib/stripe/webhooks";

export const runtime = "nodejs";

/** Stripe webhook endpoint — verifies signatures and syncs subscription state. */
export async function POST(request: Request): Promise<Response> {
  let webhookSecret: string;

  try {
    webhookSecret = getStripeWebhookSecret();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe webhook is not configured.";
    console.error("[stripe] webhook misconfigured:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    console.error("[stripe] webhook verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const idempotency = await ensureStripeIdempotency(event);

  if (idempotency.status === "duplicate") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleStripeWebhookEvent(event);
    await markStripeEventProcessed(event.id, event.type);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    console.error("[stripe] webhook handler failed:", message);
    await markStripeEventFailed(event.id, event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    received: true,
    retried: idempotency.status === "retry",
  });
}

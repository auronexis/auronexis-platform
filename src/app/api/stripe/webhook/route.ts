import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import {
  ensureStripeIdempotency,
  markStripeEventFailed,
  markStripeEventProcessed,
} from "@/lib/stripe/idempotency";
import { handleStripeWebhookEvent } from "@/lib/stripe/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function logConstructEventFailure(
  message: string,
  input: { hasSignature: boolean; bodyLength: number },
): void {
  console.error("[stripe] constructEvent failed", {
    message,
    hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasSignature: input.hasSignature,
    bodyLength: input.bodyLength,
  });
}

/** Stripe webhook endpoint — verifies signatures and syncs subscription state. */
export async function POST(request: Request): Promise<Response> {
  if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
    console.error("[stripe] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!.trim();

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    logConstructEventFailure(message, {
      hasSignature: true,
      bodyLength: body.length,
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const idempotency = await ensureStripeIdempotency(event);

  if (idempotency.status === "duplicate") {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  try {
    const handled = await handleStripeWebhookEvent(event);
    await markStripeEventProcessed(event.id, event.type);

    if (!handled) {
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    console.error("[stripe] webhook handler failed:", message);
    await markStripeEventFailed(event.id, event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(
    {
      received: true,
      retried: idempotency.status === "retry",
    },
    { status: 200 },
  );
}

/** Stripe probes with GET — return 405; POST is the only supported method. */
export async function GET(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

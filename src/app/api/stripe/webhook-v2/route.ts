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

const WEBHOOK_ENV_KEY = "STRIPE_WEBHOOK_SECRET_V2";

function logStripeWebhookV2(input: {
  hasSignature: boolean;
  eventType?: string;
  note?: string;
}): void {
  console.log("stripe webhook v2", {
    hasSecret: !!process.env[WEBHOOK_ENV_KEY],
    secretPrefix: process.env[WEBHOOK_ENV_KEY]?.slice(0, 8),
    hasSignature: input.hasSignature,
    eventType: input.eventType ?? null,
    note: input.note ?? null,
  });
}

/** Isolated Stripe webhook endpoint — uses STRIPE_WEBHOOK_SECRET_V2. */
export async function POST(request: Request): Promise<Response> {
  if (!process.env[WEBHOOK_ENV_KEY]?.trim()) {
    console.error("[stripe] Missing STRIPE_WEBHOOK_SECRET_V2");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  logStripeWebhookV2({
    hasSignature: !!signature,
    note: "incoming request",
  });

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const stripe = getStripeClient();
  const webhookSecret = process.env[WEBHOOK_ENV_KEY]!.trim();

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    console.error("[stripe] webhook v2 constructEvent failed", {
      message,
      hasSecret: !!process.env[WEBHOOK_ENV_KEY],
      secretPrefix: process.env[WEBHOOK_ENV_KEY]?.slice(0, 8),
      hasSignature: true,
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  logStripeWebhookV2({
    hasSignature: true,
    eventType: event.type,
    note: "signature verified",
  });

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
    console.error("[stripe] webhook v2 handler failed:", message);
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

export async function GET(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

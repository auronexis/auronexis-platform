import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import {
  ensureStripeIdempotency,
  markStripeEventFailed,
  markStripeEventProcessed,
} from "@/lib/stripe/idempotency";
import { handleStripeWebhookEvent } from "@/lib/stripe/webhooks";

export const runtime = "nodejs";

function webhookSecretPrefix(secret: string): string {
  if (secret.startsWith("whsec_")) {
    return `${secret.slice(0, 12)}...`;
  }
  return "(unexpected format)";
}

function logWebhookDiagnostics(input: {
  webhookSecret: string | null | undefined;
  signature: string | null;
  eventType?: string;
  note?: string;
}): void {
  console.info("[stripe] webhook diagnostics", {
    webhookSecretConfigured: Boolean(input.webhookSecret?.trim()),
    webhookSecretPrefix: input.webhookSecret?.trim()
      ? webhookSecretPrefix(input.webhookSecret.trim())
      : null,
    stripeSignaturePresent: Boolean(input.signature),
    eventType: input.eventType ?? null,
    note: input.note ?? null,
  });
}

/** Stripe webhook endpoint — verifies signatures and syncs subscription state. */
export async function POST(request: Request): Promise<Response> {
  console.log("STRIPE_WEBHOOK_SECRET loaded:", !!process.env.STRIPE_WEBHOOK_SECRET);
  console.log("secret prefix:", process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 8));

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    console.error("[stripe] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  logWebhookDiagnostics({ webhookSecret, signature, note: "incoming request" });

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const stripe = getStripeClient();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    console.error("[stripe] webhook verification failed:", message);
    logWebhookDiagnostics({
      webhookSecret,
      signature,
      note: `constructEvent failed: ${message}`,
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  logWebhookDiagnostics({
    webhookSecret,
    signature,
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

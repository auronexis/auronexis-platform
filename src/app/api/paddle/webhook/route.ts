import { NextResponse } from "next/server";
import { getPaddleClient } from "@/lib/paddle/client";
import { getPaddleWebhookSecret, isPaddleConfigured } from "@/lib/paddle/env";
import {
  ensurePaddleIdempotency,
  markPaddleEventFailed,
  markPaddleEventIgnored,
  markPaddleEventProcessed,
} from "@/lib/paddle/idempotency";
import { handlePaddleWebhookEvent } from "@/lib/paddle/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/** Paddle Billing webhook — verifies Paddle-Signature from raw body before processing. */
export async function POST(request: Request): Promise<Response> {
  if (!isPaddleConfigured()) {
    console.error("[paddle] webhook not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Paddle-Signature header" }, { status: 400 });
  }

  const paddle = getPaddleClient();
  const secret = getPaddleWebhookSecret();

  let event: {
    eventId?: string;
    event_id?: string;
    eventType?: string;
    event_type?: string;
    occurredAt?: string;
    occurred_at?: string;
    data: unknown;
  };

  try {
    event = (await paddle.webhooks.unmarshal(rawBody, secret, signature)) as typeof event;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    console.error("[paddle] signature verification failed", {
      message,
      hasSignature: true,
      bodyLength: rawBody.length,
    });
    return NextResponse.json({ error: "Invalid Paddle signature" }, { status: 400 });
  }

  const providerEventId = asString(event.eventId ?? event.event_id);
  const eventType = asString(event.eventType ?? event.event_type) ?? "unknown";

  if (!providerEventId) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const idempotency = await ensurePaddleIdempotency({
    providerEventId,
    eventType,
    rawBody,
    occurredAt: asString(event.occurredAt ?? event.occurred_at),
  });

  if (idempotency.status === "duplicate") {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  try {
    const result = await handlePaddleWebhookEvent(event);

    if (result.ignored) {
      await markPaddleEventIgnored(providerEventId);
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    await markPaddleEventProcessed(providerEventId, result.organizationId);
    return NextResponse.json(
      { received: true, retried: idempotency.status === "retry" },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    console.error("[paddle] webhook handler failed:", message);
    await markPaddleEventFailed(providerEventId, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

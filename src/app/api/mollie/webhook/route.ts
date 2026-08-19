import { NextResponse } from "next/server";

import { isMollieApiConfigured } from "@/lib/billing/providers/mollie/env";
import { getMollieCredentialMode } from "@/lib/billing/providers/mollie/mode";
import {
  ensureMollieIdempotency,
  extractMollieWebhookPaymentId,
  markMollieEventFailed,
  markMollieEventIgnored,
  markMollieEventProcessed,
  reconcileMolliePaymentWebhook,
} from "@/lib/billing/providers/mollie/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mollie inbound webhook — public, no auth.
 * Extracts payment id from body, re-fetches authoritative Payment from Mollie API,
 * validates org/customer ownership, idempotent reconcile.
 * https://docs.mollie.com/overview/webhooks
 */
export async function POST(request: Request): Promise<Response> {
  if (!isMollieApiConfigured()) {
    console.error("[mollie] webhook not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (getMollieCredentialMode() !== "test") {
    console.error("[mollie] webhook rejected — non-TEST credentials");
    return NextResponse.json({ error: "Webhook not available" }, { status: 503 });
  }

  const rawBody = await request.text();
  const paymentId = extractMollieWebhookPaymentId(rawBody);

  if (!paymentId) {
    return NextResponse.json({ error: "Missing or invalid payment id" }, { status: 400 });
  }

  const idempotency = await ensureMollieIdempotency({
    providerEventId: paymentId,
    eventType: "payment.updated",
    rawBody,
  });

  if (idempotency.status === "duplicate") {
    return NextResponse.json({ received: true, status: "duplicate" }, { status: 200 });
  }

  if (idempotency.status === "unavailable") {
    return NextResponse.json(
      { error: "Webhook temporarily unavailable. Please retry." },
      { status: 503 },
    );
  }

  try {
    const result = await reconcileMolliePaymentWebhook(paymentId);

    if (result.ignored) {
      await markMollieEventIgnored(paymentId, result.reason ?? null);
      return NextResponse.json({ received: true, status: "ignored", reason: result.reason }, { status: 200 });
    }

    await markMollieEventProcessed(paymentId, result.organizationId);
    return NextResponse.json({ received: true, status: "processed" }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    console.error("[mollie] webhook handler failed:", {
      message,
      paymentIdPrefix: paymentId.slice(0, 8),
    });
    await markMollieEventFailed(paymentId, message);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

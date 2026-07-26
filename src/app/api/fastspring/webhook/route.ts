import { NextResponse } from "next/server";
import {
  ensureFastSpringIdempotency,
  markFastSpringEventFailed,
  markFastSpringEventIgnored,
  markFastSpringEventProcessed,
} from "@/lib/fastspring/idempotency";
import { getFastSpringWebhookSecret, isFastSpringWebhookConfigured } from "@/lib/fastspring/env";
import { occurredAtFromEventCreated, parseFastSpringWebhookPayload } from "@/lib/fastspring/parse";
import {
  getFastSpringSignatureHeader,
  verifyFastSpringSignature,
} from "@/lib/fastspring/signature";
import {
  handleFastSpringWebhookEvent,
  invalidateCachesAfterFastSpringWebhook,
} from "@/lib/fastspring/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * FastSpring inbound webhook.
 *
 * Signature: HMAC-SHA256 of raw body → base64, compared to `X-FS-Signature`
 * (https://developer.fastspring.com/reference/message-security).
 *
 * Payload may contain multiple events; each is idempotent by event `id`
 * (https://developer.fastspring.com/reference/webhooks-overview).
 */
export async function POST(request: Request): Promise<Response> {
  if (!isFastSpringWebhookConfigured()) {
    console.error("[fastspring] webhook not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = getFastSpringSignatureHeader(request.headers);

  if (!signature) {
    return NextResponse.json({ error: "Missing X-FS-Signature header" }, { status: 400 });
  }

  let secret: string;
  try {
    secret = getFastSpringWebhookSecret();
  } catch {
    console.error("[fastspring] webhook secret unavailable");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verifyFastSpringSignature({ rawBody, signatureHeader: signature, secret })) {
    console.error("[fastspring] signature verification failed", {
      hasSignature: true,
      bodyLength: rawBody.length,
    });
    return NextResponse.json({ error: "Invalid FastSpring signature" }, { status: 400 });
  }

  let payload;
  try {
    payload = parseFastSpringWebhookPayload(rawBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Malformed payload";
    console.error("[fastspring] payload parse failed:", { message });
    return NextResponse.json({ error: "Malformed FastSpring payload" }, { status: 400 });
  }

  const results: Array<{
    eventId: string;
    eventType: string;
    status: "processed" | "ignored" | "duplicate" | "failed";
  }> = [];

  for (const event of payload.events) {
    const idempotency = await ensureFastSpringIdempotency({
      providerEventId: event.id,
      eventType: event.type,
      rawBody,
      occurredAt: occurredAtFromEventCreated(event.created),
    });

    if (idempotency.status === "duplicate") {
      results.push({ eventId: event.id, eventType: event.type, status: "duplicate" });
      continue;
    }

    if (idempotency.status === "unavailable") {
      return NextResponse.json(
        { error: "Webhook temporarily unavailable. Please retry." },
        { status: 503 },
      );
    }

    try {
      const result = await handleFastSpringWebhookEvent(event);

      if (result.ignored) {
        await markFastSpringEventIgnored(event.id, result.reason ?? null);
        results.push({ eventId: event.id, eventType: event.type, status: "ignored" });
        continue;
      }

      await markFastSpringEventProcessed(event.id, result.organizationId);
      invalidateCachesAfterFastSpringWebhook(result.organizationId);
      results.push({ eventId: event.id, eventType: event.type, status: "processed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Webhook handler failed.";
      console.error("[fastspring] webhook handler failed:", {
        message,
        eventType: event.type,
        providerEventIdPrefix: event.id.slice(0, 12),
      });
      await markFastSpringEventFailed(event.id, message);
      return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true, results }, { status: 200 });
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}

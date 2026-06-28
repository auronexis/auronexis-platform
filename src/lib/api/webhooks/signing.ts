import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generateWebhookSigningSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function signWebhookPayload(secret: string, payload: string, timestamp: number): string {
  return createHash("sha256")
    .update(`${timestamp}.${payload}`)
    .update(secret)
    .digest("hex");
}

export function verifyWebhookSignature(input: {
  secret: string;
  payload: string;
  timestamp: string;
  signature: string;
  toleranceSeconds?: number;
}): boolean {
  const ts = Number(input.timestamp);
  if (!Number.isFinite(ts)) {
    return false;
  }

  const tolerance = input.toleranceSeconds ?? 300;
  if (Math.abs(Date.now() / 1000 - ts) > tolerance) {
    return false;
  }

  const expected = signWebhookPayload(input.secret, input.payload, ts);
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(input.signature, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function buildWebhookSignatureHeader(secret: string, payload: string): {
  timestamp: string;
  signature: string;
} {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signWebhookPayload(secret, payload, Number(timestamp));
  return { timestamp, signature };
}

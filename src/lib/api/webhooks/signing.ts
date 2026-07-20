import "server-only";

/**
 * Thin re-export — canonical webhook signing lives in `src/lib/webhooks/signing.ts`.
 * Kept so historical `@/lib/api/webhooks/signing` imports remain stable.
 */
export {
  generateWebhookSigningSecret,
  signWebhookPayload,
  verifyWebhookSignature,
} from "@/lib/webhooks/signing";

import { buildWebhookSignatureHeaders } from "@/lib/webhooks/signing";

/** Compatibility helper matching the previous API module signature. */
export function buildWebhookSignatureHeader(secret: string, payload: string): {
  timestamp: string;
  signature: string;
} {
  const built = buildWebhookSignatureHeaders({
    secret,
    payload,
    eventType: "compat",
    deliveryId: "compat",
  });
  return { timestamp: built.timestamp, signature: built.signature };
}

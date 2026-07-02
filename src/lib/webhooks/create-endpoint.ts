import "server-only";

import { encryptSecretValue } from "@/lib/integrations/secrets/encryption";
import { createClient } from "@/lib/supabase/server";
import { generateWebhookSigningSecret } from "@/lib/webhooks/signing";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/types";
import type { WebhookEndpoint } from "@/types/database";

function validateEvents(events: string[]): string[] {
  const allowed = new Set<string>(WEBHOOK_EVENTS);
  return Array.from(new Set(events.filter((event) => allowed.has(event))));
}

/** Legacy create helper — prefer createWebhookEndpointAction from @/lib/webhooks/actions. */
export async function createWebhookEndpoint(input: {
  organizationId: string;
  url: string;
  description?: string;
  events: string[];
  createdBy: string;
}): Promise<{ endpoint: WebhookEndpoint; signingSecret: string }> {
  const signingSecret = generateWebhookSigningSecret();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webhook_endpoints")
    .insert({
      organization_id: input.organizationId,
      name: input.description?.trim() || "Webhook endpoint",
      url: input.url.trim(),
      secret: encryptSecretValue(signingSecret),
      events: validateEvents(input.events),
      active: true,
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create webhook endpoint.");
  }

  return { endpoint: data as WebhookEndpoint, signingSecret };
}

export function encryptWebhookSigningSecret(secret: string): string {
  return encryptSecretValue(secret);
}

import "server-only";

import type { HttpClientResponse } from "@/lib/integrations/execution/http-client";
import type { IntegrationProviderId } from "@/lib/integrations/types";

export type ParsedProviderResponse = {
  deliveryId?: string;
  providerMessageId?: string;
  failureReason?: string;
};

export function parseProviderResponse(
  providerId: IntegrationProviderId,
  response: HttpClientResponse,
): ParsedProviderResponse {
  if (!response.ok) {
    return {
      failureReason: truncateFailureReason(
        extractErrorMessage(response.bodyJson, response.bodyText) ??
          `HTTP ${response.status}: ${response.statusText}`,
      ),
    };
  }

  const parsed = parseSuccessBody(providerId, response);
  return {
    deliveryId: parsed.deliveryId ?? response.headers["x-request-id"],
    providerMessageId: parsed.providerMessageId,
  };
}

function parseSuccessBody(
  providerId: IntegrationProviderId,
  response: HttpClientResponse,
): ParsedProviderResponse {
  const body = response.bodyJson;

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;

    switch (providerId) {
      case "slack":
        return {
          providerMessageId: typeof record.ts === "string" ? record.ts : undefined,
        };
      case "discord":
        return {
          providerMessageId: typeof record.id === "string" ? record.id : undefined,
        };
      case "microsoft_teams":
        return {
          providerMessageId: typeof record.id === "string" ? record.id : undefined,
        };
      default:
        return {
          deliveryId: typeof record.id === "string" ? record.id : undefined,
          providerMessageId:
            typeof record.messageId === "string"
              ? record.messageId
              : typeof record.message_id === "string"
                ? record.message_id
                : undefined,
        };
    }
  }

  if (response.bodyText.trim() === "1" && providerId === "slack") {
    return { providerMessageId: "ok" };
  }

  return {};
}

function extractErrorMessage(bodyJson: unknown | null, bodyText: string): string | null {
  if (bodyJson && typeof bodyJson === "object") {
    const record = bodyJson as Record<string, unknown>;
    if (typeof record.error === "string") {
      return record.error;
    }
    if (typeof record.message === "string") {
      return record.message;
    }
  }

  const trimmed = bodyText.trim();
  return trimmed ? trimmed.slice(0, 500) : null;
}

function truncateFailureReason(reason: string): string {
  return reason.length > 1000 ? `${reason.slice(0, 997)}...` : reason;
}

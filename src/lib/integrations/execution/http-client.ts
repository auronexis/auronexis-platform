import "server-only";

import type { HttpMethod } from "@/lib/integrations/types";
import { sanitizeLogPayload } from "@/lib/integrations/secrets/masking";

export type HttpClientAuth =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "api_key"; header: string; value: string }
  | { type: "webhook"; secret: string; header?: string };

export type HttpClientRequest = {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  auth?: HttpClientAuth;
  timeoutMs?: number;
  maxAttempts?: number;
};

export type HttpClientResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  latencyMs: number;
  bodyText: string;
  bodyJson: unknown | null;
  headers: Record<string, string>;
  attempts: number;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 500;

function buildAuthHeaders(auth?: HttpClientAuth): Record<string, string> {
  if (!auth || auth.type === "none") {
    return {};
  }

  switch (auth.type) {
    case "bearer":
      return { Authorization: `Bearer ${auth.token}` };
    case "basic": {
      const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
      return { Authorization: `Basic ${encoded}` };
    }
    case "api_key":
      return { [auth.header]: auth.value };
    case "webhook": {
      const header = auth.header ?? "X-Webhook-Secret";
      return { [header]: auth.secret };
    }
    default:
      return {};
  }
}

function sanitizeHeadersForLog(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (/authorization|secret|token|api[_-]?key|password/i.test(key)) {
      sanitized[key] = "[redacted]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function sanitizeRequestForLog(request: HttpClientRequest): Record<string, unknown> {
  return sanitizeLogPayload({
    method: request.method,
    url: request.url,
    headers: sanitizeHeadersForLog({
      ...(request.headers ?? {}),
      ...buildAuthHeaders(request.auth),
    }),
    body: request.body,
    timeoutMs: request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxAttempts: request.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
  }) as Record<string, unknown>;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeHttpRequest(request: HttpClientRequest): Promise<HttpClientResponse> {
  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = Math.max(1, request.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const authHeaders = buildAuthHeaders(request.auth);
  const mergedHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(request.body != null ? { "Content-Type": "application/json" } : {}),
    ...(request.headers ?? {}),
    ...authHeaders,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const started = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: mergedHeaders,
        body:
          request.body != null && request.method !== "GET"
            ? JSON.stringify(request.body)
            : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - started;
      const bodyText = await response.text();
      let bodyJson: unknown | null = null;

      if (bodyText.trim()) {
        try {
          bodyJson = JSON.parse(bodyText) as unknown;
        } catch {
          bodyJson = null;
        }
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (response.ok || attempt === maxAttempts) {
        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          latencyMs,
          bodyText,
          bodyJson,
          headers: responseHeaders,
          attempts: attempt,
        };
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      clearTimeout(timer);
      lastError = error instanceof Error ? error : new Error("Request failed");
    }

    if (attempt < maxAttempts) {
      await sleep(BACKOFF_BASE_MS * 2 ** (attempt - 1));
    }
  }

  throw lastError ?? new Error("Request failed");
}

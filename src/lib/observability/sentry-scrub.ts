/**
 * Shared Sentry PII scrubbing — keep client and server configs aligned.
 * Minimizes auth headers, cookies, secrets, and tokens without disabling error monitoring.
 */

const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-supabase-auth",
  "x-forwarded-authorization",
]);

const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|api[_-]?key|authorization|cookie|session|refresh[_-]?token|service[_-]?role|private[_-]?key)/i;

function scrubRecord(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null) return value;
  if (typeof value === "string") {
    if (value.length > 500) return "[redacted-long]";
    if (value.includes("@") && value.includes(".")) return "[redacted-email]";
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => scrubRecord(entry, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        out[key] = "[redacted]";
        continue;
      }
      out[key] = scrubRecord(entry, depth + 1);
    }
    return out;
  }
  return value;
}

export function scrubSentryEvent<T extends Record<string, unknown>>(event: T): T | null {
  const next = { ...event } as T & {
    request?: {
      headers?: Record<string, string>;
      cookies?: unknown;
      data?: unknown;
      query_string?: unknown;
    };
    user?: Record<string, unknown>;
    extra?: Record<string, unknown>;
    contexts?: Record<string, unknown>;
  };

  if (next.request) {
    const headers = next.request.headers;
    if (headers) {
      const scrubbedHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(headers)) {
        scrubbedHeaders[key] = SENSITIVE_HEADER_KEYS.has(key.toLowerCase()) ? "[redacted]" : value;
      }
      next.request.headers = scrubbedHeaders;
    }
    if (next.request.cookies) {
      next.request.cookies = "[redacted]";
    }
    if (next.request.data) {
      next.request.data = scrubRecord(next.request.data);
    }
  }

  if (next.user) {
    next.user = {
      ...next.user,
      email: next.user.email ? "[redacted]" : undefined,
      ip_address: undefined,
      username: next.user.username ? "[redacted]" : undefined,
    };
  }

  if (next.extra) {
    next.extra = scrubRecord(next.extra) as Record<string, unknown>;
  }
  if (next.contexts) {
    next.contexts = scrubRecord(next.contexts) as Record<string, unknown>;
  }

  return next;
}

export const SENTRY_PRIVACY_INIT = {
  sendDefaultPii: false as const,
};

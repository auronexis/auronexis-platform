/**
 * Redact secret-like keys from audit/evidence export metadata.
 * Never include credential plaintext in downloadable artifacts.
 */

const SENSITIVE_KEY_PATTERN =
  /(secret|password|passwd|token|api[_-]?key|authorization|bearer|private[_-]?key|service[_-]?role|credential|integration_secret)/i;

export function sanitizeExportMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitizeExportMetadata(value as Record<string, unknown>);
      continue;
    }
    if (Array.isArray(value)) {
      out[key] = value.map((entry) =>
        entry !== null && typeof entry === "object"
          ? sanitizeExportMetadata(entry as Record<string, unknown>)
          : entry,
      );
      continue;
    }
    out[key] = value;
  }
  return out;
}

export function safeJsonStringify(value: unknown, space: number | undefined = 2): string {
  return JSON.stringify(
    value,
    (_key, current) => {
      if (typeof current === "bigint") {
        return current.toString();
      }
      if (typeof current === "undefined") {
        return null;
      }
      if (typeof current === "function" || typeof current === "symbol") {
        return undefined;
      }
      return current;
    },
    space,
  );
}

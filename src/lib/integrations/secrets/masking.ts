/** Mask secret values for display — never reconstruct the original secret. */

export function maskSecretValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "****";
  }

  if (trimmed.length <= 8) {
    return "****";
  }

  const prefix = trimmed.slice(0, Math.min(3, trimmed.length - 4));
  const suffix = trimmed.slice(-4);
  return `${prefix}****${suffix}`;
}

export function redactSecretFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSecretFields);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
        if (/secret|token|password|api[_-]?key|authorization|plaintext/i.test(key)) {
          return [key, "[redacted]"];
        }

        return [key, redactSecretFields(nested)];
      }),
    );
  }

  return value;
}

export function sanitizeLogPayload(value: unknown): unknown {
  return redactSecretFields(value);
}

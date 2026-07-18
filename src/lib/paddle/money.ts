import "server-only";

/**
 * Paddle Billing API amounts (transaction totals, price unit amounts) are
 * already expressed as strings in the smallest currency unit — e.g. "1999"
 * for $19.99, not a decimal. We never divide/round; we only validate and
 * parse the integer. Unknown shapes fail closed (null) rather than invent a value.
 */
export function parsePaddleMoneyToCents(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && Number.isInteger(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      return null;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Same parsing as {@link parsePaddleMoneyToCents} but throws for callers that
 * must fail closed rather than silently persist/display a missing amount.
 */
export function requirePaddleMoneyToCents(value: unknown, context: string): number {
  const parsed = parsePaddleMoneyToCents(value);
  if (parsed === null) {
    throw new Error(`Invalid Paddle amount for ${context}.`);
  }
  return parsed;
}

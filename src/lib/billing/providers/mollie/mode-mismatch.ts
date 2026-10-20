/**
 * Detect Mollie API "wrong mode" errors (TEST payment vs LIVE key or reverse).
 * These are non-retryable configuration mismatches — acknowledge with HTTP 200.
 */

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return "";
}

/** True when Mollie rejected the payment fetch due to test/live credential mismatch. */
export function isMollieModeMismatchError(error: unknown): boolean {
  const message = errorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }

  return (
    /wrong mode/.test(message) ||
    /mode mismatch/.test(message) ||
    /different mode/.test(message) ||
    (/test/.test(message) && /live/.test(message) && (/mode/.test(message) || /key/.test(message))) ||
    /payment.*(test|live).*(api )?key/.test(message) ||
    /(api )?key.*(test|live).*payment/.test(message)
  );
}

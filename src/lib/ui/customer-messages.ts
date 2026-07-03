const INTERNAL_PATTERNS = [
  /PGRST/i,
  /postgres/i,
  /supabase/i,
  /stripe/i,
  /STRIPE_/i,
  /NEXT_PUBLIC_/i,
  /environment variable/i,
  /undefined/i,
  /null/i,
  /\[object Object\]/i,
  /digest:/i,
  /failed to fetch/i,
];

/** Map raw errors to customer-safe copy for toasts and inline UI. */
export function sanitizeCustomerMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message || INTERNAL_PATTERNS.some((pattern) => pattern.test(message))) {
    return fallback;
  }

  return message;
}

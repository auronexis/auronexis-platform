const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /\+?\d[\d\s().-]{7,}\d/g;
const TOKEN_PATTERN = /\b(?:sk_|pk_|whsec_|eyJ)[A-Za-z0-9_-]{10,}\b/g;
const STRIPE_CUSTOMER_PATTERN = /\bcus_[A-Za-z0-9]+\b/g;
const STRIPE_SUBSCRIPTION_PATTERN = /\bsub_[A-Za-z0-9]+\b/g;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._-]+/gi;

export function redactSensitiveText(input: string): string {
  return input
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(PHONE_PATTERN, "[redacted-phone]")
    .replace(TOKEN_PATTERN, "[redacted-token]")
    .replace(STRIPE_CUSTOMER_PATTERN, "[redacted-stripe-customer]")
    .replace(STRIPE_SUBSCRIPTION_PATTERN, "[redacted-stripe-subscription]")
    .replace(BEARER_PATTERN, "Bearer [redacted]");
}

export function redactObjectForPrompt<T extends Record<string, unknown>>(obj: T): T {
  const serialized = redactSensitiveText(JSON.stringify(obj));
  return JSON.parse(serialized) as T;
}

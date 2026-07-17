import "server-only";

export type PaddleEnvironment = "sandbox" | "production";

function requireServerEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Paddle API key — server-only. Never import from client components. */
export function getPaddleApiKey(): string {
  return requireServerEnv("PADDLE_API_KEY");
}

/** Paddle webhook secret — server-only. */
export function getPaddleWebhookSecret(): string {
  return requireServerEnv("PADDLE_WEBHOOK_SECRET");
}

/**
 * Paddle.js client token — public by design (NEXT_PUBLIC_*).
 * Still validated server-side before returning to the browser for checkout.
 */
export function getPaddleClientToken(): string {
  return requireServerEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN");
}

export function getPaddleEnvironment(): PaddleEnvironment {
  const raw = process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase();
  if (raw !== "sandbox" && raw !== "production") {
    throw new Error(
      'Invalid PADDLE_ENVIRONMENT. Expected exactly "sandbox" or "production".',
    );
  }
  return raw;
}

export function isPaddleConfigured(): boolean {
  return Boolean(
    process.env.PADDLE_API_KEY?.trim() &&
      process.env.PADDLE_WEBHOOK_SECRET?.trim() &&
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() &&
      (process.env.PADDLE_ENVIRONMENT === "sandbox" ||
        process.env.PADDLE_ENVIRONMENT === "production"),
  );
}

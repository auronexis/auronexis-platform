/** Customer-safe auth copy — never expose Supabase or internal errors. */
export const AUTH_MESSAGES = {
  INVALID_EMAIL: "Invalid email address.",
  RESET_SENT:
    "If an account exists for this email, we've sent reset instructions.",
  RESET_FAILED: "We couldn't send a reset email.",
  RATE_LIMITED: "Too many attempts. Please try again later.",
  NETWORK_ERROR: "We couldn't reach the server. Check your connection and try again.",
  PASSWORD_UPDATED: "Password updated successfully.",
  PASSWORD_TOO_WEAK:
    "Password too weak. Use at least 12 characters with uppercase, lowercase, and a number.",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match.",
  RESET_TOKEN_INVALID: "This reset link is invalid or has expired.",
  RESET_SESSION_EXPIRED: "Your reset session has expired. Request a new reset link.",
  CONFIGURATION_ERROR: "Password reset is temporarily unavailable. Please try again later.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
} as const;

export type AuthMessageKey = keyof typeof AUTH_MESSAGES;

type AuthErrorLike = {
  message?: string;
  status?: number;
  name?: string;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as AuthErrorLike).message ?? "").toLowerCase();
  }
  return "";
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as AuthErrorLike).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

/** Map Supabase/auth errors to friendly customer copy. */
export function sanitizeAuthError(
  error: unknown,
  fallback: string = AUTH_MESSAGES.GENERIC_ERROR,
): string {
  const message = errorMessage(error);
  const status = errorStatus(error);

  if (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("over_email_send_rate_limit")
  ) {
    return AUTH_MESSAGES.RATE_LIMITED;
  }

  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("econnrefused") ||
    message.includes("timeout")
  ) {
    return AUTH_MESSAGES.NETWORK_ERROR;
  }

  if (message.includes("invalid email") || message.includes("valid email")) {
    return AUTH_MESSAGES.INVALID_EMAIL;
  }

  if (
    message.includes("expired") ||
    message.includes("invalid") ||
    message.includes("otp") ||
    message.includes("token") ||
    message.includes("session")
  ) {
    return AUTH_MESSAGES.RESET_TOKEN_INVALID;
  }

  if (message.includes("weak") || message.includes("password")) {
    return AUTH_MESSAGES.PASSWORD_TOO_WEAK;
  }

  return fallback;
}

/** Returns true when the error should not block enumeration-safe success UX. */
export function isBenignPasswordResetError(error: unknown): boolean {
  const message = errorMessage(error);
  return (
    message.includes("user not found") ||
    message.includes("no user") ||
    message.includes("signup is disabled")
  );
}

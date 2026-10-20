import { createHash } from "node:crypto";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";

/**
 * Server-side checks for every NEW password (signup, invite, portal user,
 * reset, change). Mirrors the Supabase Auth password settings
 * (min. 12 characters, upper + lower case + digit) and adds a breached-password
 * check, because Supabase's built-in leaked-password protection requires the
 * Pro plan.
 *
 * Breach check uses the Have I Been Pwned range API with k-anonymity: only the
 * first 5 characters of the SHA-1 hash leave the server, never the password.
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

export const PASSWORD_BREACHED_MESSAGE =
  "This password has appeared in a known data breach. Please choose a different password.";

const PWNED_RANGE_URL = "https://api.pwnedpasswords.com/range/";
const DEFAULT_TIMEOUT_MS = 2500;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function isPasswordBreached(
  password: string,
  options: { fetchImpl?: FetchLike; timeoutMs?: number } = {},
): Promise<boolean> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sha1 = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await fetchImpl(`${PWNED_RANGE_URL}${prefix}`, {
      headers: { "Add-Padding": "true", "User-Agent": "Auroranexis-password-check" },
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) return false;

    const body = await response.text();
    for (const line of body.split("\n")) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix && Number(count) > 0) return true;
    }
    return false;
  } catch {
    // Fail open: an unreachable breach API must never block sign-up or reset.
    return false;
  }
}

/** Returns a user-facing error message, or null when the new password is acceptable. */
export async function checkNewPassword(
  password: string,
  options?: { fetchImpl?: FetchLike; timeoutMs?: number },
): Promise<string | null> {
  if (!validatePasswordPolicy(password).valid) {
    return AUTH_MESSAGES.PASSWORD_TOO_WEAK;
  }
  if (await isPasswordBreached(password, options)) {
    return PASSWORD_BREACHED_MESSAGE;
  }
  return null;
}

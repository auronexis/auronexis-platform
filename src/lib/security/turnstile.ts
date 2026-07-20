import "server-only";

import { isSecurityEnforcementDisabledForE2E } from "@/lib/security/e2e-bypass";
import {
  TURNSTILE_MISCONFIGURED_ERROR,
  TURNSTILE_RESPONSE_FIELD,
  TURNSTILE_RETRY_ERROR,
  readTurnstileSecretKeyFromEnv,
  readTurnstileSiteKeyFromEnv,
} from "@/lib/security/turnstile-shared";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export {
  TURNSTILE_MISCONFIGURED_ERROR,
  TURNSTILE_RESPONSE_FIELD,
  TURNSTILE_RETRY_ERROR,
  TURNSTILE_SECRET_KEY_ENV,
  TURNSTILE_SITE_KEY_ENV,
} from "@/lib/security/turnstile-shared";

export function getTurnstileSiteKey(): string | null {
  return readTurnstileSiteKeyFromEnv();
}

export function isTurnstileConfigured(): boolean {
  if (isSecurityEnforcementDisabledForE2E()) {
    return false;
  }
  const siteKey = getTurnstileSiteKey();
  const secret = readTurnstileSecretKeyFromEnv();
  return Boolean(siteKey && secret);
}

/** Production always requires verification; non-production only when keys are configured. */
export function isTurnstileRequired(): boolean {
  return isTurnstileConfigured() || process.env.NODE_ENV === "production";
}

export type TurnstileVerifyReason =
  | "not_configured"
  | "missing_token"
  | "invalid_token"
  | "provider_error";

export type TurnstileGateResult =
  | { ok: true }
  | { ok: false; reason: TurnstileVerifyReason; error: string };

type TurnstileVerifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

async function callTurnstileSiteverify(
  token: string,
  remoteIp?: string | null,
): Promise<{ ok: true } | { ok: false; reason: "invalid_token" | "provider_error" }> {
  const secret = readTurnstileSecretKeyFromEnv();
  if (!secret) {
    return { ok: false, reason: "invalid_token" };
  }

  const body: Record<string, string> = {
    secret,
    response: token.trim(),
  };

  if (remoteIp) {
    body.remoteip = remoteIp;
  }

  let response: Response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, reason: "provider_error" };
  }

  if (!response.ok) {
    return { ok: false, reason: "provider_error" };
  }

  let payload: TurnstileVerifyResponse;
  try {
    payload = (await response.json()) as TurnstileVerifyResponse;
  } catch {
    return { ok: false, reason: "provider_error" };
  }

  if (payload.success === true) {
    return { ok: true };
  }

  return { ok: false, reason: "invalid_token" };
}

/**
 * Verify a Turnstile token when protection is configured.
 * Fail-closed in production when keys are missing.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<boolean> {
  const result = await evaluateTurnstileToken(token, remoteIp);
  return result.ok;
}

export async function evaluateTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<TurnstileGateResult> {
  if (!isTurnstileConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        reason: "not_configured",
        error: TURNSTILE_MISCONFIGURED_ERROR,
      };
    }
    return { ok: true };
  }

  if (!token || token.trim().length === 0) {
    return { ok: false, reason: "missing_token", error: TURNSTILE_RETRY_ERROR };
  }

  const verified = await callTurnstileSiteverify(token, remoteIp);
  if (!verified.ok) {
    return {
      ok: false,
      reason: verified.reason,
      error: TURNSTILE_RETRY_ERROR,
    };
  }

  return { ok: true };
}

export async function verifyTurnstileFromForm(
  formData: FormData,
  remoteIp?: string | null,
): Promise<boolean> {
  const result = await evaluateTurnstileFromForm(formData, remoteIp);
  return result.ok;
}

export async function evaluateTurnstileFromForm(
  formData: FormData,
  remoteIp?: string | null,
): Promise<TurnstileGateResult> {
  const token = formData.get(TURNSTILE_RESPONSE_FIELD);
  return evaluateTurnstileToken(typeof token === "string" ? token : null, remoteIp);
}

/** Gate used by auth and public forms — skips only when verification is not required. */
export async function requireTurnstileFromForm(
  formData: FormData,
  remoteIp?: string | null,
): Promise<TurnstileGateResult> {
  if (!isTurnstileRequired()) {
    return { ok: true };
  }
  return evaluateTurnstileFromForm(formData, remoteIp);
}

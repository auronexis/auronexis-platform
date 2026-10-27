import "server-only";

import { isSecurityEnforcementDisabledForE2E } from "@/lib/security/e2e-bypass";
import { extractTrustedIpFromHeaders } from "@/lib/security/rate-limit";
import {
  TURNSTILE_RESPONSE_FIELD,
  TURNSTILE_RETRY_ERROR,
  getTurnstileSiteKey,
} from "@/lib/security/turnstile-shared";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5_000;
const MAX_TOKEN_LENGTH = 2048;

export type TurnstileGateResult = { ok: true } | { ok: false; error: string };

function getTurnstileSecretKey(): string | null {
  const key = process.env.TURNSTILE_SECRET_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

/** Bot protection runs only when both keys are set (and never in E2E runs). */
export function isTurnstileEnforced(): boolean {
  if (isSecurityEnforcementDisabledForE2E()) {
    return false;
  }
  return Boolean(getTurnstileSiteKey() && getTurnstileSecretKey());
}

async function resolveRemoteIp(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers");
    return extractTrustedIpFromHeaders(await headers());
  } catch {
    return null;
  }
}

type SiteverifyOutcome = "valid" | "invalid" | "unreachable";

async function callSiteverify(token: string, secret: string, remoteIp: string | null): Promise<SiteverifyOutcome> {
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    if (!response.ok) {
      return "unreachable";
    }
    const payload = (await response.json()) as { success?: boolean };
    return payload.success === true ? "valid" : "invalid";
  } catch {
    return "unreachable";
  }
}

/**
 * Gate for sign-in, registration, password reset and public forms.
 * - Keys not configured → allowed (rate limits remain the protection).
 * - Missing or rejected token → blocked.
 * - Cloudflare unreachable → allowed and logged, so an outage at Cloudflare does not lock
 *   every customer out; the per-email and per-IP rate limits still apply.
 */
export async function requireTurnstileFromForm(formData: FormData): Promise<TurnstileGateResult> {
  if (!isTurnstileEnforced()) {
    return { ok: true };
  }

  const raw = formData.get(TURNSTILE_RESPONSE_FIELD);
  const token = typeof raw === "string" ? raw.trim() : "";
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, error: TURNSTILE_RETRY_ERROR };
  }

  const outcome = await callSiteverify(token, getTurnstileSecretKey() ?? "", await resolveRemoteIp());
  if (outcome === "valid") {
    return { ok: true };
  }
  if (outcome === "unreachable") {
    console.error("[security] Turnstile siteverify unreachable — allowing request, rate limits still apply");
    return { ok: true };
  }
  return { ok: false, error: TURNSTILE_RETRY_ERROR };
}

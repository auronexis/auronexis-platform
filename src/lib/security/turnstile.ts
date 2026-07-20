import "server-only";

import { isSecurityEnforcementDisabledForE2E } from "@/lib/security/e2e-bypass";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured(): boolean {
  if (isSecurityEnforcementDisabledForE2E()) {
    return false;
  }
  const siteKey = getTurnstileSiteKey();
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  return Boolean(siteKey && secret);
}

export function getTurnstileSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

type TurnstileVerifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

/** Verify Cloudflare Turnstile token — skipped when Turnstile is not configured. */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<boolean> {
  if (!isTurnstileConfigured()) {
    // Fail closed in production when bot protection keys are missing.
    return process.env.NODE_ENV !== "production";
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return false;
  }

  if (!token || token.trim().length === 0) {
    return false;
  }

  const body: Record<string, string> = {
    secret,
    response: token.trim(),
  };

  if (remoteIp) {
    body.remoteip = remoteIp;
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json()) as TurnstileVerifyResponse;
  return payload.success === true;
}

export async function verifyTurnstileFromForm(
  formData: FormData,
  remoteIp?: string | null,
): Promise<boolean> {
  const token = formData.get("cf-turnstile-response");
  return verifyTurnstileToken(typeof token === "string" ? token : null, remoteIp);
}

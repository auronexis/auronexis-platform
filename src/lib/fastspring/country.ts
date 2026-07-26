import "server-only";

import { headers } from "next/headers";

const ISO_COUNTRY_RE = /^[A-Z]{2}$/;

/** Normalize to ISO 3166-1 alpha-2 or null. */
export function normalizeCountryCode(value: string | null | undefined): string | null {
  const code = (value ?? "").trim().toUpperCase();
  if (!ISO_COUNTRY_RE.test(code)) {
    return null;
  }
  // Reject non-country pseudo codes occasionally seen in geo headers.
  if (code === "XX" || code === "T1" || code === "A1" || code === "A2") {
    return null;
  }
  return code;
}

/**
 * Weak locale → country hint from Accept-Language (e.g. de-DE → DE).
 * Never treat language alone (e.g. "de") as a billing country.
 */
export function countryFromAcceptLanguage(acceptLanguage: string | null | undefined): string | null {
  if (!acceptLanguage) {
    return null;
  }
  const primary = acceptLanguage.split(",")[0]?.trim();
  if (!primary) {
    return null;
  }
  const region = primary.split("-")[1] ?? primary.split("_")[1];
  return normalizeCountryCode(region);
}

export type ResolveBillingCountryInput = {
  /** Explicit supported choice (query/cookie/org setting) when present. */
  explicitCountry?: string | null;
  /** Trusted edge geo (e.g. Vercel x-vercel-ip-country). */
  geoCountry?: string | null;
  acceptLanguage?: string | null;
  fallbackCountry?: string;
};

/**
 * Country resolution for localized pricing display.
 * Precedence: explicit → trusted geo → locale region → safe fallback (US).
 */
export function resolveBillingCountry(input: ResolveBillingCountryInput = {}): string {
  return (
    normalizeCountryCode(input.explicitCountry) ??
    normalizeCountryCode(input.geoCountry) ??
    countryFromAcceptLanguage(input.acceptLanguage) ??
    normalizeCountryCode(input.fallbackCountry) ??
    "US"
  );
}

/** Resolve country from the current Next.js request headers. */
export async function resolveRequestBillingCountry(options?: {
  explicitCountry?: string | null;
}): Promise<string> {
  const h = await headers();
  return resolveBillingCountry({
    explicitCountry: options?.explicitCountry,
    geoCountry: h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry"),
    acceptLanguage: h.get("accept-language"),
    fallbackCountry: "US",
  });
}

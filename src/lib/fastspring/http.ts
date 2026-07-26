import "server-only";

import { getFastSpringApiPassword, getFastSpringApiUsername } from "@/lib/fastspring/env";

export const FASTSPRING_API_BASE_URL = "https://api.fastspring.com";
export const FASTSPRING_API_USER_AGENT = "Auroranexis/1.0 (+https://www.auroranexis.com)";

const DEFAULT_TIMEOUT_MS = 12_000;

export type FastSpringApiFetchResult = {
  ok: boolean;
  status: number;
  json: unknown;
};

/**
 * Authenticated FastSpring REST call (HTTP Basic Auth).
 * Never logs credentials, Authorization headers, or full payloads.
 * https://developer.fastspring.com/reference/api-overview
 */
export async function fastSpringApiFetch(
  pathWithQuery: string,
  options?: { timeoutMs?: number },
): Promise<FastSpringApiFetchResult> {
  const username = getFastSpringApiUsername();
  const password = getFastSpringApiPassword();
  const authorization = `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${FASTSPRING_API_BASE_URL}${pathWithQuery}`, {
      method: "GET",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": FASTSPRING_API_USER_AGENT,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    let json: unknown = null;
    const text = await response.text();
    if (text) {
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        json = null;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      json,
    };
  } finally {
    clearTimeout(timeout);
  }
}

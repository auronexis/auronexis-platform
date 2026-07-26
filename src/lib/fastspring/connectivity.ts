import "server-only";

import {
  getFastSpringApiCredentialPresence,
  getFastSpringApiPassword,
  getFastSpringApiUsername,
} from "@/lib/fastspring/env";

/**
 * Harmless read-only FastSpring connectivity probe.
 * Official auth: HTTP Basic Auth + mandatory User-Agent + Content-Type
 * https://developer.fastspring.com/reference/api-overview
 * List accounts: GET https://api.fastspring.com/accounts
 * https://developer.fastspring.com/reference/list-all-accounts
 */
export const FASTSPRING_API_BASE_URL = "https://api.fastspring.com";
export const FASTSPRING_CONNECTIVITY_PATH = "/accounts?limit=1";
export const FASTSPRING_CONNECTIVITY_ENDPOINT = `GET ${FASTSPRING_API_BASE_URL}${FASTSPRING_CONNECTIVITY_PATH}`;

export type FastSpringConnectivityErrorCategory =
  | "not_configured"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "network_error"
  | "timeout"
  | "unexpected_status";

export type FastSpringConnectivityResult = {
  configured: boolean;
  usernameConfigured: boolean;
  passwordConfigured: boolean;
  connected: boolean;
  httpStatus: number | null;
  errorCategory: FastSpringConnectivityErrorCategory | null;
  endpoint: typeof FASTSPRING_CONNECTIVITY_ENDPOINT;
};

const USER_AGENT = "Auroranexis/1.0 (+https://www.auroranexis.com)";
const REQUEST_TIMEOUT_MS = 12_000;

function categorizeHttpStatus(status: number): FastSpringConnectivityErrorCategory {
  if (status === 401) {
    return "unauthorized";
  }
  if (status === 403) {
    return "forbidden";
  }
  if (status === 429) {
    return "rate_limited";
  }
  return "unexpected_status";
}

/**
 * Probe FastSpring API authentication from the current server environment.
 * Never returns credentials, Authorization headers, or response bodies.
 */
export async function probeFastSpringApiConnectivity(): Promise<FastSpringConnectivityResult> {
  const presence = getFastSpringApiCredentialPresence();
  const base = {
    configured: presence.configured,
    usernameConfigured: presence.usernameConfigured,
    passwordConfigured: presence.passwordConfigured,
    endpoint: FASTSPRING_CONNECTIVITY_ENDPOINT,
  } as const;

  if (!presence.configured) {
    return {
      ...base,
      connected: false,
      httpStatus: null,
      errorCategory: "not_configured",
    };
  }

  let username: string;
  let password: string;
  try {
    username = getFastSpringApiUsername();
    password = getFastSpringApiPassword();
  } catch {
    return {
      ...base,
      configured: false,
      connected: false,
      httpStatus: null,
      errorCategory: "not_configured",
    };
  }

  const authorization = `Basic ${Buffer.from(`${username}:${password}`, "utf8").toString("base64")}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${FASTSPRING_API_BASE_URL}${FASTSPRING_CONNECTIVITY_PATH}`, {
      method: "GET",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    // Discard body — never inspect or log payload contents for this probe.
    await response.arrayBuffer().catch(() => undefined);

    if (response.ok) {
      return {
        ...base,
        connected: true,
        httpStatus: response.status,
        errorCategory: null,
      };
    }

    console.error("[fastspring] api connectivity probe failed", {
      httpStatus: response.status,
      errorCategory: categorizeHttpStatus(response.status),
    });

    return {
      ...base,
      connected: false,
      httpStatus: response.status,
      errorCategory: categorizeHttpStatus(response.status),
    };
  } catch (error) {
    const aborted =
      (error instanceof Error && error.name === "AbortError") ||
      (typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "AbortError");

    const errorCategory: FastSpringConnectivityErrorCategory = aborted
      ? "timeout"
      : "network_error";

    console.error("[fastspring] api connectivity probe error", { errorCategory });

    return {
      ...base,
      connected: false,
      httpStatus: null,
      errorCategory,
    };
  } finally {
    clearTimeout(timeout);
  }
}

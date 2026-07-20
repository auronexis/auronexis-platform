/**
 * Outbound URL safety for server-side fetches (webhooks, integrations).
 * Rejects non-HTTP(S), localhost/private/link-local, and cloud metadata targets.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

function isIpv4(hostname: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

function parseIpv4(hostname: string): number[] | null {
  if (!isIpv4(hostname)) {
    return null;
  }
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return parts;
}

function isPrivateOrReservedIpv4(parts: number[]): boolean {
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (host === "metadata" || host.startsWith("metadata.")) return true;

  if (host.includes(":")) {
    // IPv6 literal (possibly bracket-stripped)
    const v6 = host.replace(/^\[|\]$/g, "");
    if (v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80")) {
      return true;
    }
  }

  const ipv4 = parseIpv4(host);
  if (ipv4 && isPrivateOrReservedIpv4(ipv4)) {
    return true;
  }

  return false;
}

export type OutboundUrlValidationResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

/** Validate a URL intended for server-side outbound HTTP(S). */
export function validateOutboundUrl(raw: string): OutboundUrlValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: "URL is required." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "URL is invalid." };
  }

  const protocol = parsed.protocol.toLowerCase();
  const allowHttpLocal =
    process.env.NODE_ENV !== "production" &&
    protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

  if (protocol !== "https:" && !allowHttpLocal) {
    return { ok: false, reason: "Only HTTPS destinations are allowed." };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "URLs with embedded credentials are not allowed." };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return { ok: false, reason: "Destination host is not allowed." };
  }

  return { ok: true, url: parsed };
}

/** Throws when the URL is unsafe for outbound server requests. */
export function assertSafeOutboundUrl(raw: string): string {
  const result = validateOutboundUrl(raw);
  if (!result.ok) {
    throw new Error(result.reason);
  }
  return result.url.toString();
}

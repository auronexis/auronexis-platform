/**
 * Trusted client IP for companion abuse buckets.
 * Only trusts x-forwarded-for / x-real-ip when running on Vercel (platform sets these).
 * Server Actions without a trusted platform IP skip IP companions — documented residual.
 */

export function isTrustedIpPlatform(): boolean {
  return process.env.VERCEL === "1";
}

export function extractTrustedIpFromHeaders(headerStore: {
  get(name: string): string | null;
}): string | null {
  if (!isTrustedIpPlatform()) {
    return null;
  }
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded && forwarded.length > 0 && forwarded.length <= 128) {
    return forwarded;
  }
  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp && realIp.length > 0 && realIp.length <= 128) {
    return realIp;
  }
  return null;
}

export function extractTrustedIpFromRequest(request: Request): string | null {
  if (!isTrustedIpPlatform()) {
    return null;
  }
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded && forwarded.length > 0 && forwarded.length <= 128) {
    return forwarded;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length > 0 && realIp.length <= 128) {
    return realIp;
  }
  return null;
}
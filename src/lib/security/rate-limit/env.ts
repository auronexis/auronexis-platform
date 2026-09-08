/**
 * Soft Upstash Redis env helpers — never throw at import/build time.
 * Secrets are server-only (no NEXT_PUBLIC_).
 */

export type UpstashRedisEnv = {
  url: string;
  token: string;
};

export function getUpstashRedisEnv(): UpstashRedisEnv | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  if (!url || !token) {
    return null;
  }
  return { url, token };
}

export function isUpstashRedisConfigured(): boolean {
  return getUpstashRedisEnv() !== null;
}
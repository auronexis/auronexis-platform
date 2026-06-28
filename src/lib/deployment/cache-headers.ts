/** Cache header routes — keep in sync with `vercel.json` headers configuration. */
export const CACHE_HEADER_ROUTES = [
  {
    source: "/api/health",
    cacheControl: "no-store, max-age=0",
    description: "Health probes must never be cached.",
  },
  {
    source: "/_next/static/(.*)",
    cacheControl: "public, max-age=31536000, immutable",
    description: "Immutable Next.js build assets.",
  },
  {
    source: "/branding/(.*)",
    cacheControl: "public, max-age=86400, stale-while-revalidate=604800",
    description: "Branding assets with daily refresh.",
  },
] as const;

export const SECURITY_HEADER_KEYS = [
  "Content-Security-Policy",
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Strict-Transport-Security",
] as const;

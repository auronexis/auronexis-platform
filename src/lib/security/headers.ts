/** Security headers configured in `vercel.json` — keep in sync on changes. */
export const GO_LIVE_SECURITY_HEADERS = [
  "Content-Security-Policy",
  "X-Frame-Options",
  "Strict-Transport-Security",
  "Referrer-Policy",
  "Permissions-Policy",
  "X-Content-Type-Options",
] as const;

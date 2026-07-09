import { buildContentSecurityPolicy } from "./csp";

/** Security headers configured in `vercel.json` — keep in sync on changes. */
export const GO_LIVE_SECURITY_HEADERS = [
  "Content-Security-Policy",
  "X-Frame-Options",
  "Strict-Transport-Security",
  "Referrer-Policy",
  "Permissions-Policy",
  "X-Content-Type-Options",
  "Cross-Origin-Opener-Policy",
  "Cross-Origin-Resource-Policy",
] as const;

export type SecurityHeader = {
  key: string;
  value: string;
};

/** Production security headers applied to HTML and API responses. */
export function getSecurityHeaders(includeHsts: boolean): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  ];

  if (includeHsts) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}

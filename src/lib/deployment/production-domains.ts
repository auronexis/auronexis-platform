/** Production hostnames — keep aligned with DNS and Vercel domain settings. */
export const PRODUCTION_DOMAINS = {
  apex: "auroranexis.com",
  www: "www.auroranexis.com",
  app: "app.auroranexis.com",
  staging: "staging.auroranexis.com",
} as const;

export type ProductionDomainKey = keyof typeof PRODUCTION_DOMAINS;

export const PRODUCTION_DOMAIN_LIST = Object.values(PRODUCTION_DOMAINS);

/** Canonical redirect rules — apex → www for marketing; never redirect /api/* (Paddle webhooks). */
export const PRODUCTION_DOMAIN_REDIRECTS = [
  {
    sourceHost: PRODUCTION_DOMAINS.apex,
    destination: `https://${PRODUCTION_DOMAINS.www}`,
    permanent: true,
    excludePathPrefixes: ["/api/"] as const,
    description:
      "Marketing apex → www. API routes must stay on the requested host. Disable the blanket apex redirect in Vercel Domains and use vercel.json redirects instead.",
  },
] as const;

export function isProductionDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "";
  return PRODUCTION_DOMAIN_LIST.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

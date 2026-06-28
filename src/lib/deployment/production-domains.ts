/** Production hostnames — keep aligned with DNS and Vercel domain settings. */
export const PRODUCTION_DOMAINS = {
  apex: "auroranexis.com",
  www: "www.auroranexis.com",
  app: "app.auroranexis.com",
  staging: "staging.auroranexis.com",
} as const;

export type ProductionDomainKey = keyof typeof PRODUCTION_DOMAINS;

export const PRODUCTION_DOMAIN_LIST = Object.values(PRODUCTION_DOMAINS);

/** Canonical redirect rules — mirrored in `next.config.ts` and deployment docs. */
export const PRODUCTION_DOMAIN_REDIRECTS = [
  {
    sourceHost: PRODUCTION_DOMAINS.www,
    destination: `https://${PRODUCTION_DOMAINS.apex}`,
    permanent: true,
    description: "WWW apex consolidation for marketing SEO.",
  },
] as const;

export function isProductionDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "";
  return PRODUCTION_DOMAIN_LIST.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

export function resolveDomainRole(hostname: string): "marketing" | "app" | "staging" | "unknown" {
  const normalized = hostname.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "";
  if (normalized === PRODUCTION_DOMAINS.app) return "app";
  if (normalized === PRODUCTION_DOMAINS.staging) return "staging";
  if (normalized === PRODUCTION_DOMAINS.apex || normalized === PRODUCTION_DOMAINS.www) return "marketing";
  return "unknown";
}

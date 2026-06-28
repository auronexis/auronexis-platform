/** Production hostnames — keep aligned with DNS and Vercel domain settings. */
export const PRODUCTION_DOMAINS = {
  apex: "auroranexis.com",
  www: "www.auroranexis.com",
  app: "app.auroranexis.com",
  staging: "staging.auroranexis.com",
} as const;

export type ProductionDomainKey = keyof typeof PRODUCTION_DOMAINS;

export const PRODUCTION_DOMAIN_LIST = Object.values(PRODUCTION_DOMAINS);

/** Canonical redirect rules — configure in Vercel Domains only (not next.config). */
export const PRODUCTION_DOMAIN_REDIRECTS = [
  {
    sourceHost: PRODUCTION_DOMAINS.www,
    destination: `https://${PRODUCTION_DOMAINS.apex}`,
    permanent: true,
    description: "WWW → apex (Vercel Domains UI — do not duplicate in next.config).",
  },
] as const;

export function isProductionDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^https?:\/\//, "").split("/")[0] ?? "";
  return PRODUCTION_DOMAIN_LIST.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

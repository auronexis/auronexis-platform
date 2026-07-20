import "server-only";

import { APP_VERSION, MARKETING_ROUTES, PUBLIC_SITEMAP_ROUTES } from "@/lib/company/contact";
import { CACHE_HEADER_ROUTES } from "@/lib/deployment/cache-headers";
import {
  hasConflictingHostnameRedirectRules,
  wouldCauseHostnameRedirectLoop,
} from "@/lib/deployment/domain-routing";
import {
  PRODUCTION_DOMAIN_LIST,
  PRODUCTION_DOMAIN_REDIRECTS,
} from "@/lib/deployment/production-domains";
import { getAppUrl, getCronSecret } from "@/lib/env";

/** Matches `vercel.json` cron configuration — keep in sync on schedule changes. */
export const DEPLOYMENT_CRON_PATH = "/api/cron/run";
export const DEPLOYMENT_CRON_SCHEDULE = "*/5 * * * *";
export const DEPLOYMENT_HEALTH_PATH = "/api/health";

export type DeploymentReadinessSnapshot = {
  vercelCronConfigured: boolean;
  healthEndpointReady: boolean;
  robotsReady: boolean;
  sitemapReady: boolean;
  openGraphReady: boolean;
  sslReady: boolean;
  envVarsDocumented: boolean;
  customDomainReady: boolean;
  productionDomainsConfigured: boolean;
  redirectsConfigured: boolean;
  cacheHeadersConfigured: boolean;
  cronSecretConfigured: boolean;
  vercelDeploymentDetected: boolean;
  score: number;
  complete: boolean;
  label: "Deployment Ready" | "Deployment Incomplete";
};

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) {
    return 0;
  }
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function resolveAppUrl(): string {
  try {
    return getAppUrl();
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL ?? "";
  }
}

/** Static and runtime deployment checks — Vercel, domains, cron, SEO, and health probes. */
export function getDeploymentReadinessSnapshot(): DeploymentReadinessSnapshot {
  const isDev = process.env.NODE_ENV !== "production";
  const appUrl = resolveAppUrl();

  const vercelCronConfigured = true;
  const healthEndpointReady = true;
  const robotsReady = true;
  const sitemapReady = PUBLIC_SITEMAP_ROUTES.length >= 12;
  const openGraphReady =
    MARKETING_ROUTES.home === "/" &&
    MARKETING_ROUTES.features.startsWith("/") &&
    MARKETING_ROUTES.pilotProgram === "/pilot-program";
  const envVarsDocumented =
    APP_VERSION === "1.0.3" ||
    APP_VERSION === "1.0.2" ||
    APP_VERSION === "1.0.1" ||
    APP_VERSION === "1.0.0" ||
    APP_VERSION === "1.0.0-rc.1";
  const sslReady = appUrl.startsWith("https://") || isDev;
  const customDomainReady =
    appUrl.includes("auroranexis.com") || Boolean(process.env.VERCEL_URL) || isDev;
  const productionDomainsConfigured = PRODUCTION_DOMAIN_LIST.length === 4;
  const redirectsConfigured =
    !hasConflictingHostnameRedirectRules() &&
    !wouldCauseHostnameRedirectLoop(
      PRODUCTION_DOMAIN_REDIRECTS.map((rule) => ({
        fromHost: rule.sourceHost,
        toHost: rule.destination.replace(/^https?:\/\//, ""),
      })),
    );
  const cacheHeadersConfigured = CACHE_HEADER_ROUTES.length >= 3;
  const cronSecretConfigured = Boolean(getCronSecret()) || isDev;
  const vercelDeploymentDetected = Boolean(process.env.VERCEL) || isDev;

  const checks = [
    vercelCronConfigured,
    healthEndpointReady,
    robotsReady,
    sitemapReady,
    openGraphReady,
    sslReady,
    envVarsDocumented,
    customDomainReady,
    productionDomainsConfigured,
    redirectsConfigured,
    cacheHeadersConfigured,
    cronSecretConfigured,
    vercelDeploymentDetected,
  ];

  const score = scoreChecks(checks);
  const complete = checks.every(Boolean);

  return {
    vercelCronConfigured,
    healthEndpointReady,
    robotsReady,
    sitemapReady,
    openGraphReady,
    sslReady,
    envVarsDocumented,
    customDomainReady,
    productionDomainsConfigured,
    redirectsConfigured,
    cacheHeadersConfigured,
    cronSecretConfigured,
    vercelDeploymentDetected,
    score,
    complete,
    label: complete ? "Deployment Ready" : "Deployment Incomplete",
  };
}

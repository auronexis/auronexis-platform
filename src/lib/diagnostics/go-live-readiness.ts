import "server-only";

import {
  INFO_EMAIL,
  MARKETING_ROUTES,
  NO_REPLY_EMAIL,
  SALES_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";
import { ALL_CONNECTOR_CONFIGS } from "@/lib/connectors/definitions";
import { getAbuseProtectionSnapshot } from "@/lib/diagnostics/abuse-protection";
import { getDeploymentReadinessSnapshot } from "@/lib/diagnostics/deployment-readiness";
import { getPilotAcquisitionSnapshot } from "@/lib/diagnostics/pilot-acquisition";
import { getPilotExecutionReadinessSnapshot } from "@/lib/diagnostics/pilot-execution-readiness";
import { getSecurityReadinessSnapshot } from "@/lib/diagnostics/security-readiness";
import { getAppUrl } from "@/lib/env";
import { GO_LIVE_SECURITY_HEADERS } from "@/lib/security/headers";

export { GO_LIVE_SECURITY_HEADERS } from "@/lib/security/headers";

export const GO_LIVE_OAUTH_CONNECTOR_COUNT = 13;

export type GoLiveReadinessSnapshot = {
  deploymentScore: number;
  monitoringScore: number;
  securityScore: number;
  billingScore: number;
  oauthScore: number;
  stagingScore: number;
  supportScore: number;
  legalScore: number;
  operationsScore: number;
  infrastructureScore: number;
  domainScore: number;
  mailScore: number;
  deploymentReady: boolean;
  monitoringReady: boolean;
  securityReady: boolean;
  billingReady: boolean;
  oauthReady: boolean;
  stagingReady: boolean;
  supportReady: boolean;
  legalReady: boolean;
  operationsReady: boolean;
  infrastructureReady: boolean;
  domainReady: boolean;
  mailReady: boolean;
  score: number;
  complete: boolean;
  label: "Go-Live Ready" | "Go-Live Incomplete";
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

function isEmailConfigured(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Sprint 6 go-live readiness — deployment, monitoring, security, billing, OAuth, and operations. */
export function getGoLiveReadinessSnapshot(): GoLiveReadinessSnapshot {
  const isDev = process.env.NODE_ENV !== "production";
  const appUrl = resolveAppUrl();
  const deployment = getDeploymentReadinessSnapshot();
  const acquisition = getPilotAcquisitionSnapshot();
  const pilotExecution = getPilotExecutionReadinessSnapshot();
  const securityReadiness = getSecurityReadinessSnapshot();
  const abuseProtection = getAbuseProtectionSnapshot();

  const sentryConfigured = Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
  const posthogConfigured = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
  const stripeTestMode =
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ||
    isDev ||
    !process.env.STRIPE_SECRET_KEY;
  const stripeWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const oauthConnectorsRegistered = ALL_CONNECTOR_CONFIGS.filter((c) => c.oauth === "oauth2").length;

  const deploymentChecks = [
    deployment.score >= 90,
    deployment.vercelCronConfigured,
    deployment.healthEndpointReady,
    deployment.sslReady,
    deployment.robotsReady,
    deployment.sitemapReady,
    deployment.openGraphReady,
  ];
  const deploymentScore = scoreChecks(deploymentChecks);
  const deploymentReady = deploymentScore >= 95;

  const monitoringChecks = [
    sentryConfigured || isDev,
    posthogConfigured || isDev,
    deployment.healthEndpointReady,
    MARKETING_ROUTES.status === "/status",
    GO_LIVE_SECURITY_HEADERS.length >= 6,
  ];
  const monitoringScore = scoreChecks(monitoringChecks);
  const monitoringReady = monitoringScore >= 95;

  const securityScore = Math.round((securityReadiness.score + abuseProtection.score) / 2);
  const securityReady = securityReadiness.complete && securityScore >= 95;

  const billingChecks = [
    stripeTestMode,
    stripeWebhookSecret || isDev,
    Boolean(process.env.STRIPE_STARTER_PRICE_ID),
    Boolean(process.env.STRIPE_PROFESSIONAL_PRICE_ID),
    Boolean(process.env.STRIPE_BUSINESS_PRICE_ID),
    Boolean(process.env.STRIPE_ENTERPRISE_PRICE_ID),
  ];
  const billingScore = scoreChecks(billingChecks);
  const billingReady = billingScore >= 95;

  const oauthChecks = [
    oauthConnectorsRegistered >= GO_LIVE_OAUTH_CONNECTOR_COUNT,
    ALL_CONNECTOR_CONFIGS.some((c) => c.id === "google"),
    ALL_CONNECTOR_CONFIGS.some((c) => c.id === "microsoft"),
    ALL_CONNECTOR_CONFIGS.some((c) => c.id === "slack"),
    ALL_CONNECTOR_CONFIGS.some((c) => c.id === "salesforce"),
  ];
  const oauthScore = scoreChecks(oauthChecks);
  const oauthReady = oauthScore >= 95;

  const stagingChecks = [
    appUrl.includes("auroranexis.com") || isDev || Boolean(process.env.VERCEL_URL),
    deployment.customDomainReady,
    pilotExecution.demoWorkspaceConfigured,
    pilotExecution.e2eSuiteReady,
  ];
  const stagingScore = scoreChecks(stagingChecks);
  const stagingReady = stagingScore >= 95;

  const supportScore = acquisition.supportReadiness;
  const supportReady = supportScore >= 95;
  const legalScore = acquisition.legalReadiness;
  const legalReady = legalScore >= 95;

  const operationsChecks = [
    pilotExecution.score >= 98,
    acquisition.pilotReadiness >= 95,
    isEmailConfigured(SUPPORT_EMAIL),
    isEmailConfigured(SALES_EMAIL),
    MARKETING_ROUTES.pilotProgram === "/pilot-program",
    MARKETING_ROUTES.help === "/help",
  ];
  const operationsScore = scoreChecks(operationsChecks);
  const operationsReady = operationsScore >= 95;

  const infrastructureChecks = [
    deployment.cronSecretConfigured || isDev,
    deployment.vercelCronConfigured,
    abuseProtection.webhookAbusePreventionEnabled,
    abuseProtection.unrestrictedPublicEndpoints === 0,
    Boolean(process.env.INTEGRATION_SECRET_KEY) || isDev,
    pilotExecution.deploymentReady,
  ];
  const infrastructureScore = scoreChecks(infrastructureChecks);
  const infrastructureReady = infrastructureScore >= 95;

  const domainChecks = [
    appUrl.includes("auroranexis.com") || isDev,
    deployment.customDomainReady,
    deployment.sslReady,
    MARKETING_ROUTES.home === "/",
  ];
  const domainScore = scoreChecks(domainChecks);
  const domainReady = domainScore >= 95;

  const mailChecks = [
    isEmailConfigured(INFO_EMAIL),
    isEmailConfigured(SUPPORT_EMAIL),
    isEmailConfigured(SALES_EMAIL),
    isEmailConfigured(SECURITY_EMAIL),
    isEmailConfigured(NO_REPLY_EMAIL),
  ];
  const mailScore = scoreChecks(mailChecks);
  const mailReady = mailScore >= 95;

  const sectionScores = [
    deploymentScore,
    monitoringScore,
    securityScore,
    billingScore,
    oauthScore,
    stagingScore,
    supportScore,
    legalScore,
    operationsScore,
    infrastructureScore,
  ];
  const score = Math.round(sectionScores.reduce((sum, value) => sum + value, 0) / sectionScores.length);
  const complete =
    score >= 99 &&
    deploymentReady &&
    securityReady &&
    mailReady &&
    operationsReady &&
    abuseProtection.complete;

  return {
    deploymentScore,
    monitoringScore,
    securityScore,
    billingScore,
    oauthScore,
    stagingScore,
    supportScore,
    legalScore,
    operationsScore,
    infrastructureScore,
    domainScore,
    mailScore,
    deploymentReady,
    monitoringReady,
    securityReady,
    billingReady,
    oauthReady,
    stagingReady,
    supportReady,
    legalReady,
    operationsReady,
    infrastructureReady,
    domainReady,
    mailReady,
    score,
    complete,
    label: complete ? "Go-Live Ready" : "Go-Live Incomplete",
  };
}

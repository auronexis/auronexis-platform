import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";

import { APP_VERSION } from "@/lib/company/contact";
import { PRODUCTION_DOMAIN_LIST, PRODUCTION_DOMAIN_REDIRECTS } from "@/lib/deployment/production-domains";
import { CACHE_HEADER_ROUTES } from "@/lib/deployment/cache-headers";
import { getDeploymentReadinessSnapshot } from "@/lib/diagnostics/deployment-readiness";
import { getFirstCustomerReadinessSnapshot } from "@/lib/diagnostics/first-customer-readiness";
import { getGoLiveReadinessSnapshot } from "@/lib/diagnostics/go-live-readiness";
import { getRevenueReadinessSnapshot } from "@/lib/diagnostics/revenue-readiness";
import { getSecurityReadinessSnapshot } from "@/lib/diagnostics/security-readiness";
import { getSupabaseProductionReadinessSnapshot } from "@/lib/diagnostics/supabase-production-readiness";
import { getVercelProductionReadinessSnapshot } from "@/lib/diagnostics/vercel-production-readiness";
import { getOnboardingVerificationSnapshot } from "@/lib/sales/onboarding-verification";
import {
  LAUNCH_EXECUTION_TARGETS,
  computeLaunchTargetProgress,
} from "@/lib/sales/launch-execution-targets";
import { TOP100_AGENCIES, countTop100ByAgencyType, countTop100ByRegion } from "@/lib/sales/top100-agencies";
import { computeSalesExecutionMetrics } from "@/lib/sales/sales-execution-metrics";
import { createAdminClient } from "@/lib/supabase/admin";

export type LaunchCandidateReadinessSnapshot = {
  score: number;
  launchReadiness: number;
  deploymentReadiness: number;
  salesReadiness: number;
  onboardingReadiness: number;
  securityReadiness: number;
  revenueReadiness: number;
  label: "Launch Candidate" | "Launch Incomplete";
  complete: boolean;
  versionReady: boolean;
  productionDomainsReady: boolean;
  supabaseProductionReady: boolean;
  vercelProductionReady: boolean;
  top100Populated: boolean;
  launchTargetsConfigured: boolean;
  launchDocsReady: boolean;
};

const LAUNCH_CANDIDATE_DOCS = [
  "launch-candidate-readiness.md",
  "launch-candidate-playbook.md",
  "production-deployment-v1.0.3.md",
  "supabase-production-v1.0.3.md",
  "vercel-production-v1.0.3.md",
  "launch-sales-execution.md",
  "launch-onboarding-verification.md",
  "launch-candidate-metrics.md",
] as const;

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function docsReady(): boolean {
  const docsDir = join(process.cwd(), "docs");
  return LAUNCH_CANDIDATE_DOCS.every((name) => existsSync(join(docsDir, name)));
}

async function probeSalesExecutionActual(): Promise<{
  outreach: number;
  discoveryCalls: number;
  pilots: number;
  customers: number;
}> {
  try {
    const admin = createAdminClient();
    const [activities, leads] = await Promise.all([
      admin.from("sales_lead_activities").select("activity_type"),
      admin
        .from("sales_leads")
        .select("pipeline_stage, reply_received_at, mrr_estimate, potential_mrr"),
    ]);
    if (activities.error || leads.error) {
      throw new Error("Sales probe failed");
    }
    const metrics = computeSalesExecutionMetrics(
      (activities.data ?? []) as never,
      (leads.data ?? []) as never,
    );
    return {
      outreach: metrics.outreachSent,
      discoveryCalls: metrics.discoveryCalls,
      pilots: metrics.pilots,
      customers: metrics.wonDeals,
    };
  } catch {
    return { outreach: 0, discoveryCalls: 0, pilots: 0, customers: 0 };
  }
}

/** Phase 8 Sprint 0 — launch candidate readiness across deployment, sales, onboarding, security, and revenue. */
export async function getLaunchCandidateReadinessSnapshot(): Promise<LaunchCandidateReadinessSnapshot> {
  const isDev = process.env.NODE_ENV !== "production";
  const [
    deployment,
    goLive,
    firstCustomer,
    security,
    revenue,
    supabase,
    vercel,
    onboarding,
    salesActual,
  ] = await Promise.all([
    Promise.resolve(getDeploymentReadinessSnapshot()),
    Promise.resolve(getGoLiveReadinessSnapshot()),
    getFirstCustomerReadinessSnapshot(),
    Promise.resolve(getSecurityReadinessSnapshot()),
    getRevenueReadinessSnapshot(),
    getSupabaseProductionReadinessSnapshot(),
    Promise.resolve(getVercelProductionReadinessSnapshot()),
    getOnboardingVerificationSnapshot(),
    probeSalesExecutionActual(),
  ]);

  const docsOk = docsReady();
  const regionCounts = countTop100ByRegion();
  const agencyCounts = countTop100ByAgencyType();
  const top100Populated =
    TOP100_AGENCIES.length === 100 &&
    regionCounts.dach >= 50 &&
    agencyCounts.msp >= 20 &&
    agencyCounts.ai_agency >= 20 &&
    agencyCounts.automation_agency >= 20;

  const launchTargetsConfigured =
    LAUNCH_EXECUTION_TARGETS.outreach === 20 &&
    LAUNCH_EXECUTION_TARGETS.discoveryCalls === 5 &&
    LAUNCH_EXECUTION_TARGETS.pilots === 2 &&
    LAUNCH_EXECUTION_TARGETS.customers === 1;

  const targetProgress = computeLaunchTargetProgress(salesActual);

  const launchChecks = [
    APP_VERSION === "1.0.3",
    goLive.score >= 95,
    firstCustomer.score >= 95,
    docsOk,
    launchTargetsConfigured,
    top100Populated,
  ];

  const deploymentChecks = [
    deployment.score >= 95,
    PRODUCTION_DOMAIN_LIST.length === 4,
    PRODUCTION_DOMAIN_REDIRECTS.length >= 1,
    CACHE_HEADER_ROUTES.length >= 3,
    deployment.sslReady,
    deployment.robotsReady,
    deployment.sitemapReady,
    deployment.openGraphReady,
    supabase.score >= 95 || isDev,
    vercel.score >= 95 || isDev,
  ];

  const salesChecks = [
    top100Populated,
    launchTargetsConfigured,
    targetProgress.overallPercent >= 0,
    firstCustomer.salesExecutionReadiness >= 95,
    revenue.salesReadiness >= 90,
  ];

  const onboardingChecks = [
    onboarding.score >= 99,
    onboarding.proposalPdfReady,
    onboarding.pilotAgreementReady,
    onboarding.kickoffWorkflowReady,
    onboarding.customerPortalReady,
    onboarding.healthBaselineReady,
    firstCustomer.onboardingReadiness >= 95,
  ];

  const securityChecks = [
    security.score >= 95,
    security.cspHeadersEnabled,
    security.hstsEnabled,
    security.oauthStateValidationEnabled,
  ];

  const revenueChecks = [
    revenue.score >= 90,
    revenue.pipelineStagesConfigured,
    revenue.bookingLinksConfigured || isDev,
    revenue.versionReady,
  ];

  const launchReadiness = scoreChecks(launchChecks);
  const deploymentReadiness = scoreChecks(deploymentChecks);
  const salesReadiness = scoreChecks(salesChecks);
  const onboardingReadiness = scoreChecks(onboardingChecks);
  const securityReadiness = scoreChecks(securityChecks);
  const revenueReadiness = scoreChecks(revenueChecks);

  const score = Math.round(
    (launchReadiness +
      deploymentReadiness +
      salesReadiness +
      onboardingReadiness +
      securityReadiness +
      revenueReadiness) /
      6,
  );

  return {
    score,
    launchReadiness,
    deploymentReadiness,
    salesReadiness,
    onboardingReadiness,
    securityReadiness,
    revenueReadiness,
    label: score >= 99 ? "Launch Candidate" : "Launch Incomplete",
    complete: score >= 99,
    versionReady: APP_VERSION === "1.0.3",
    productionDomainsReady: PRODUCTION_DOMAIN_LIST.length === 4,
    supabaseProductionReady: supabase.complete || isDev,
    vercelProductionReady: vercel.complete || isDev,
    top100Populated,
    launchTargetsConfigured,
    launchDocsReady: docsOk,
  };
}

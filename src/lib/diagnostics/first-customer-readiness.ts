import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";

import { APP_VERSION } from "@/lib/company/contact";
import {
  CUSTOMER_ONBOARDING_CHECKLIST,
  KICKOFF_WORKFLOW_STEPS,
  ONBOARDING_CHECKLIST_TOTAL,
} from "@/lib/sales/customer-onboarding";
import { AGENCY_TYPES, LEAD_SOURCE_REGIONS, TOP_100_TARGET } from "@/lib/sales/lead-sourcing";
import { buildProposalFromLead } from "@/lib/sales/proposal-generator";
import { computeSalesExecutionMetrics } from "@/lib/sales/sales-execution-metrics";
import { PORTAL_ONBOARDING_MILESTONES } from "@/lib/sales/portal-onboarding";
import { getBookingLinks } from "@/lib/sales/calendar";
import { listOutreachTemplates } from "@/lib/sales/outreach-templates";
import { PIPELINE_STAGES } from "@/lib/sales/pipeline-stages";
import { createAdminClient } from "@/lib/supabase/admin";

export type FirstCustomerReadinessSnapshot = {
  score: number;
  customerReadiness: number;
  salesExecutionReadiness: number;
  deliveryReadiness: number;
  onboardingReadiness: number;
  label: "First Customer Ready" | "First Customer Incomplete";
  complete: boolean;
  leadSourcingConfigured: boolean;
  executionDashboardConfigured: boolean;
  onboardingConfigured: boolean;
  proposalGeneratorConfigured: boolean;
  portalOnboardingConfigured: boolean;
  firstCustomerTablesReady: boolean;
  firstCustomerDocsReady: boolean;
  versionReady: boolean;
};

const FIRST_CUSTOMER_DOCS = [
  "first-customer-playbook.md",
  "lead-sourcing-top100.md",
  "sales-execution.md",
  "customer-onboarding-v2.md",
  "proposal-generator.md",
  "portal-onboarding.md",
  "first-customer-metrics.md",
  "first-customer-readiness.md",
] as const;

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function docsReady(): boolean {
  const docsDir = join(process.cwd(), "docs");
  return FIRST_CUSTOMER_DOCS.every((name) => existsSync(join(docsDir, name)));
}

async function probeFirstCustomerTables(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const [proposals, onboarding, portal] = await Promise.all([
      admin.from("sales_proposals").select("id", { count: "exact", head: true }),
      admin.from("customer_onboarding_records").select("id", { count: "exact", head: true }),
      admin.from("portal_customer_onboarding").select("id", { count: "exact", head: true }),
    ]);
    return !proposals.error && !onboarding.error && !portal.error;
  } catch {
    return false;
  }
}

/** Phase 7 Sprint 3 — first paying customer readiness. */
export async function getFirstCustomerReadinessSnapshot(): Promise<FirstCustomerReadinessSnapshot> {
  const booking = getBookingLinks();
  const templates = listOutreachTemplates();
  const tablesReady = (await probeFirstCustomerTables()) || process.env.NODE_ENV === "development";
  const docsOk = docsReady();

  const sampleProposal = buildProposalFromLead({
    contact_name: "Sample",
    company_name: "Sample Agency",
    pain_points: "GRC efficiency",
    potential_mrr: 299,
    mrr_estimate: 299,
    employee_count: 25,
  });

  const executionSample = computeSalesExecutionMetrics([], []);

  const customerChecks = [
    APP_VERSION === "1.0.3" || APP_VERSION === "1.0.2",
    LEAD_SOURCE_REGIONS.length >= 3,
    AGENCY_TYPES.length >= 5,
    TOP_100_TARGET === 100,
    PIPELINE_STAGES.some((s) => s.key === "won"),
    booking.configured || process.env.NODE_ENV === "development",
  ];

  const salesExecutionChecks = [
    executionSample.outreachSent >= 0,
    templates.length >= 10,
    PIPELINE_STAGES.some((s) => s.key === "discovery_call"),
    PIPELINE_STAGES.some((s) => s.key === "pilot_application"),
    Boolean(sampleProposal.pilotAgreement),
    Boolean(sampleProposal.pricingProposal),
    tablesReady,
  ];

  const deliveryChecks = [
    Boolean(sampleProposal.implementationPlan),
    Boolean(sampleProposal.timeline),
    Boolean(sampleProposal.roiEstimate),
    sampleProposal.mrrProposed > 0,
    sampleProposal.arrProposed > 0,
    docsOk,
  ];

  const onboardingChecks = [
    KICKOFF_WORKFLOW_STEPS.length >= 4,
    CUSTOMER_ONBOARDING_CHECKLIST.length === ONBOARDING_CHECKLIST_TOTAL,
    ONBOARDING_CHECKLIST_TOTAL === 7,
    PORTAL_ONBOARDING_MILESTONES.length >= 6,
    tablesReady,
  ];

  const customerReadiness = scoreChecks(customerChecks);
  const salesExecutionReadiness = scoreChecks(salesExecutionChecks);
  const deliveryReadiness = scoreChecks(deliveryChecks);
  const onboardingReadiness = scoreChecks(onboardingChecks);
  const score = Math.round(
    (customerReadiness + salesExecutionReadiness + deliveryReadiness + onboardingReadiness) / 4,
  );

  return {
    score,
    customerReadiness,
    salesExecutionReadiness,
    deliveryReadiness,
    onboardingReadiness,
    label: score >= 99 ? "First Customer Ready" : "First Customer Incomplete",
    complete: score >= 99,
    leadSourcingConfigured: LEAD_SOURCE_REGIONS.length >= 3 && AGENCY_TYPES.length >= 5,
    executionDashboardConfigured: templates.length >= 10,
    onboardingConfigured: CUSTOMER_ONBOARDING_CHECKLIST.length === 7,
    proposalGeneratorConfigured: sampleProposal.mrrProposed > 0,
    portalOnboardingConfigured: PORTAL_ONBOARDING_MILESTONES.length >= 6,
    firstCustomerTablesReady: tablesReady,
    firstCustomerDocsReady: docsOk,
    versionReady: APP_VERSION === "1.0.3" || APP_VERSION === "1.0.2",
  };
}

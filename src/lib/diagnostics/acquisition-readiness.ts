import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";

import { APP_VERSION } from "@/lib/company/contact";
import { ENRICHMENT_FIELDS } from "@/lib/sales/enrichment";
import { OUTBOUND_LIST_TYPES } from "@/lib/sales/outbound-lists";
import { listOutreachTemplates } from "@/lib/sales/outreach-templates";
import {
  EMAIL_CADENCE_DAYS,
  ESCALATION_DAYS,
  LEAD_AGING_DAYS,
  NO_RESPONSE_DAYS,
  REMINDER_TYPES,
} from "@/lib/sales/automation";
import {
  CUSTOMER_SUCCESS_MILESTONES_TOTAL,
  PILOT_ONBOARDING_CHECKLIST,
} from "@/lib/sales/customer-success";
import { getBookingLinks } from "@/lib/sales/calendar";
import { listSalesAssets } from "@/lib/sales/assets";
import { FOUNDING_CUSTOMER_LIMIT, FOUNDING_CUSTOMER_OFFER } from "@/lib/sales/founding-program";
import { PIPELINE_STAGES, SALES_INBOXES } from "@/lib/sales/pipeline-stages";
import { createAdminClient } from "@/lib/supabase/admin";

export type AcquisitionReadinessSnapshot = {
  score: number;
  salesReadiness: number;
  acquisitionReadiness: number;
  revenueReadiness: number;
  customerSuccessReadiness: number;
  label: "Customer Acquisition Ready" | "Customer Acquisition Incomplete";
  complete: boolean;
  outboundListsConfigured: boolean;
  enrichmentConfigured: boolean;
  templatesConfigured: boolean;
  automationConfigured: boolean;
  customerSuccessConfigured: boolean;
  acquisitionTablesReady: boolean;
  acquisitionDocsReady: boolean;
  versionReady: boolean;
};

const ACQUISITION_DOCS = [
  "acquisition-playbook.md",
  "first-100-leads.md",
  "outreach-library.md",
  "customer-success.md",
  "founding-customers-v3.md",
  "lead-scoring.md",
  "sales-automation.md",
  "acquisition-readiness.md",
] as const;

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function docsReady(): boolean {
  const docsDir = join(process.cwd(), "docs");
  return ACQUISITION_DOCS.every((name) => existsSync(join(docsDir, name)));
}

async function probeAcquisitionTables(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const [lists, success, reminders] = await Promise.all([
      admin.from("outbound_lists").select("id", { count: "exact", head: true }),
      admin.from("customer_success_records").select("id", { count: "exact", head: true }),
      admin.from("sales_lead_reminders").select("id", { count: "exact", head: true }),
    ]);
    return !lists.error && !success.error && !reminders.error;
  } catch {
    return false;
  }
}

/** Phase 7 Sprint 2 — customer acquisition readiness across sales, outbound, revenue, and success. */
export async function getAcquisitionReadinessSnapshot(): Promise<AcquisitionReadinessSnapshot> {
  const booking = getBookingLinks();
  const assets = listSalesAssets();
  const templates = listOutreachTemplates();
  const acquisitionTablesReady =
    (await probeAcquisitionTables()) || process.env.NODE_ENV === "development";
  const acquisitionDocsReady = docsReady();

  const salesChecks = [
    PIPELINE_STAGES.length >= 8,
    SALES_INBOXES.length >= 4,
    assets.length >= 6,
    booking.configured || process.env.NODE_ENV === "development",
    PIPELINE_STAGES.some((stage) => stage.key === "discovery_call"),
    PIPELINE_STAGES.some((stage) => stage.key === "pilot_application"),
  ];

  const acquisitionChecks = [
    OUTBOUND_LIST_TYPES.length >= 6,
    templates.length >= 10,
    ENRICHMENT_FIELDS.length >= 10,
    REMINDER_TYPES.length >= 4,
    EMAIL_CADENCE_DAYS.length >= 4,
    LEAD_AGING_DAYS > 0,
    NO_RESPONSE_DAYS > 0,
    ESCALATION_DAYS > 0,
    acquisitionTablesReady,
    acquisitionDocsReady,
  ];

  const revenueChecks = [
    APP_VERSION.startsWith("1.0."),
    PIPELINE_STAGES.some((stage) => stage.key === "won"),
    PIPELINE_STAGES.some((stage) => stage.key === "lost"),
    assets.some((asset) => asset.key === "pricingPdf"),
    FOUNDING_CUSTOMER_LIMIT === 10,
    Boolean(FOUNDING_CUSTOMER_OFFER.summary),
  ];

  const customerSuccessChecks = [
    PILOT_ONBOARDING_CHECKLIST.length >= 8,
    CUSTOMER_SUCCESS_MILESTONES_TOTAL === 8,
    acquisitionTablesReady,
    templates.some((t) => t.key === "pilot_acceptance"),
    templates.some((t) => t.key === "win_back"),
  ];

  const salesReadiness = scoreChecks(salesChecks);
  const acquisitionReadiness = scoreChecks(acquisitionChecks);
  const revenueReadiness = scoreChecks(revenueChecks);
  const customerSuccessReadiness = scoreChecks(customerSuccessChecks);
  const score = Math.round(
    (salesReadiness + acquisitionReadiness + revenueReadiness + customerSuccessReadiness) / 4,
  );
  const complete = score >= 99;

  return {
    score,
    salesReadiness,
    acquisitionReadiness,
    revenueReadiness,
    customerSuccessReadiness,
    label: complete ? "Customer Acquisition Ready" : "Customer Acquisition Incomplete",
    complete,
    outboundListsConfigured: OUTBOUND_LIST_TYPES.length >= 6,
    enrichmentConfigured: ENRICHMENT_FIELDS.length >= 10,
    templatesConfigured: templates.length >= 10,
    automationConfigured: REMINDER_TYPES.length >= 4 && EMAIL_CADENCE_DAYS.length >= 4,
    customerSuccessConfigured: PILOT_ONBOARDING_CHECKLIST.length >= 8,
    acquisitionTablesReady,
    acquisitionDocsReady,
    versionReady: APP_VERSION.startsWith("1.0."),
  };
}

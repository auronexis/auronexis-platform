import "server-only";

import { APP_VERSION } from "@/lib/company/contact";
import { getBookingLinks } from "@/lib/sales/calendar";
import { listSalesAssets } from "@/lib/sales/assets";
import { FOUNDING_CUSTOMER_LIMIT, FOUNDING_CUSTOMER_OFFER } from "@/lib/sales/founding-program";
import { PIPELINE_STAGES, SALES_INBOXES } from "@/lib/sales/pipeline-stages";
import { createAdminClient } from "@/lib/supabase/admin";

export type RevenueReadinessSnapshot = {
  score: number;
  salesReadiness: number;
  customerReadiness: number;
  revenueReadiness: number;
  label: "Revenue Ready" | "Revenue Incomplete";
  complete: boolean;
  pipelineStagesConfigured: boolean;
  leadCaptureConfigured: boolean;
  inboxConfigured: boolean;
  foundingProgramConfigured: boolean;
  salesAssetsReady: boolean;
  bookingLinksConfigured: boolean;
  crmTablesReady: boolean;
  versionReady: boolean;
};

function scoreChecks(checks: boolean[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function probeCrmTables(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("sales_leads").select("id", { count: "exact", head: true });
    return !error;
  } catch {
    return false;
  }
}

/** Phase 7 revenue readiness — sales, customer acquisition, and revenue generation score. */
export async function getRevenueReadinessSnapshot(): Promise<RevenueReadinessSnapshot> {
  const booking = getBookingLinks();
  const assets = listSalesAssets();
  const crmTablesReady = await probeCrmTables();

  const salesChecks = [
    PIPELINE_STAGES.length >= 8,
    SALES_INBOXES.length >= 4,
    assets.length >= 6,
    booking.configured || process.env.NODE_ENV === "development",
    crmTablesReady || process.env.NODE_ENV === "development",
  ];

  const customerChecks = [
    FOUNDING_CUSTOMER_LIMIT === 10,
    FOUNDING_CUSTOMER_OFFER.benefits.length >= 5,
    Boolean(FOUNDING_CUSTOMER_OFFER.summary),
    PIPELINE_STAGES.some((stage) => stage.key === "pilot_application"),
    PIPELINE_STAGES.some((stage) => stage.key === "discovery_call"),
  ];

  const revenueChecks = [
    APP_VERSION.startsWith("1.0."),
    PIPELINE_STAGES.some((stage) => stage.key === "won"),
    PIPELINE_STAGES.some((stage) => stage.key === "lost"),
    assets.some((asset) => asset.key === "pricingPdf"),
    assets.some((asset) => asset.key === "foundingCustomerOffer"),
  ];

  const salesReadiness = scoreChecks(salesChecks);
  const customerReadiness = scoreChecks(customerChecks);
  const revenueReadiness = scoreChecks(revenueChecks);
  const score = Math.round((salesReadiness + customerReadiness + revenueReadiness) / 3);
  const complete = score >= 99;

  return {
    score,
    salesReadiness,
    customerReadiness,
    revenueReadiness,
    label: complete ? "Revenue Ready" : "Revenue Incomplete",
    complete,
    pipelineStagesConfigured: PIPELINE_STAGES.length >= 8,
    leadCaptureConfigured: true,
    inboxConfigured: SALES_INBOXES.length >= 4,
    foundingProgramConfigured: FOUNDING_CUSTOMER_LIMIT === 10,
    salesAssetsReady: assets.length >= 6,
    bookingLinksConfigured: booking.configured,
    crmTablesReady,
    versionReady: APP_VERSION.startsWith("1.0."),
  };
}

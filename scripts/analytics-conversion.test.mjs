import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("unified analytics taxonomy defines conversion and product events", () => {
  const taxonomy = readSource("src/lib/analytics/taxonomy.ts");
  const events = readSource("src/lib/analytics/events.ts");
  for (const name of [
    "landing_page_view",
    "pricing_view",
    "signup_completed",
    "workspace_created",
    "subscription_checkout_started",
    "subscription_checkout_completed",
    "invoice_paid",
    "client_created",
    "report_generated",
    "dashboard_loaded",
    "ai_summary_generated",
    "integration_connected",
  ]) {
    assert.match(taxonomy, new RegExp(name));
    assert.match(events, new RegExp(name));
  }
});

test("analytics events sanitize blocked identifiers and PII keys", () => {
  const events = readSource("src/lib/analytics/events.ts");
  assert.match(events, /workspace|organization|client_id|api_key|token|secret/i);
  assert.match(events, /value\.includes\("@"\)/);
});

test("GA4 disables automatic page_view to prevent duplicates", () => {
  const provider = readSource("src/components/analytics/analytics-provider.tsx");
  const events = readSource("src/lib/analytics/events.ts");
  assert.match(provider, /send_page_view:false/);
  assert.match(events, /page_view/);
  assert.match(events, /page_path/);
});

test("landing page and pricing conversion trackers are wired", () => {
  const pageTracker = readSource("src/components/analytics/page-view-tracker.tsx");
  const pricing = readSource("src/app/(marketing)/pricing/page.tsx");
  const signup = readSource("src/app/(auth)/signup/page.tsx");
  assert.match(pageTracker, /landing_page_view/);
  assert.match(pricing, /pricing_view/);
  assert.match(signup, /signup_started/);
});

test("dashboard and billing conversion instrumentation exists", () => {
  const dashboardLayout = readSource("src/app/(dashboard)/layout.tsx");
  const dashboardTracker = readSource("src/components/analytics/dashboard-analytics-tracker.tsx");
  const billingPanel = readSource("src/components/settings/billing-settings-panel.tsx");
  const pricingGrid = readSource("src/components/pricing/pricing-grid.tsx");
  assert.match(dashboardLayout, /DashboardAnalyticsTracker/);
  assert.match(dashboardTracker, /dashboard_loaded/);
  const billingTracker = readSource("src/components/analytics/billing-conversion-tracker.tsx");
  assert.match(billingPanel, /BillingConversionTracker/);
  assert.match(billingTracker, /subscription_checkout_completed/);
  assert.match(pricingGrid, /subscription_checkout_started/);
});

test("product forms queue privacy-safe product analytics events", () => {
  const clientForm = readSource("src/components/clients/client-form.tsx");
  const reportForm = readSource("src/components/reports/report-form.tsx");
  const riskForm = readSource("src/components/risks/risk-form.tsx");
  const incidentForm = readSource("src/components/incidents/incident-form.tsx");
  assert.match(clientForm, /client_created/);
  assert.match(reportForm, /report_generated/);
  assert.match(riskForm, /risk_created/);
  assert.match(incidentForm, /incident_created/);
});

test("stripe webhooks emit server-side conversion analytics without billing logic changes", () => {
  const webhooks = readSource("src/lib/stripe/webhooks.ts");
  const serverEvents = readSource("src/lib/analytics/server-events.ts");
  assert.match(webhooks, /trackServerAnalyticsEvent/);
  assert.match(webhooks, /invoice_paid/);
  assert.match(webhooks, /invoice_failed/);
  assert.match(webhooks, /subscription_cancelled/);
  assert.match(serverEvents, /GA4_API_SECRET/);
  assert.doesNotMatch(serverEvents, /organization_id/);
});

test("consent-gated providers remain unchanged", () => {
  const provider = readSource("src/components/analytics/analytics-provider.tsx");
  const clarity = readSource("src/components/analytics/clarity-script.tsx");
  assert.match(provider, /hasAnalyticsConsent|hasMarketingConsent/);
  assert.match(clarity, /hasAnalyticsConsent/);
  assert.match(provider, /getElementById\("ga4-script"\)/);
});

test("documentation and integration surfaces track product analytics", () => {
  const docsHub = readSource("src/app/docs/page.tsx");
  const docsSlug = readSource("src/app/docs/[slug]/page.tsx");
  const integrationCenter = readSource("src/components/settings/integration-center-workspace.tsx");
  assert.match(docsHub, /DocsViewTracker/);
  assert.match(docsSlug, /DocsViewTracker/);
  assert.match(integrationCenter, /integration_connected/);
});

test("package.json exposes analytics conversion test script", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /test:analytics-conversion/);
});

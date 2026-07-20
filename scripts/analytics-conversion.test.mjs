import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
    "subscription_checkout_cancelled",
    "invoice_paid",
    "client_created",
    "report_generated",
    "dashboard_loaded",
    "ai_summary_generated",
    "integration_connected",
    "portal_login",
  ]) {
    assert.match(taxonomy, new RegExp(name));
    assert.match(events, new RegExp(name));
  }
});

test("analytics events sanitize blocked identifiers and PII keys", () => {
  const events = readSource("src/lib/analytics/events.ts");
  assert.match(events, /organization_id/);
  assert.match(events, /BLOCKED_PROP_KEYS/);
  assert.match(events, /value\.includes\("@"\)/);
  assert.match(events, /funnel_stage/);
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
  assert.match(pageTracker, /resolvePageViewSurface/);
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
  assert.doesNotMatch(dashboardTracker, /signup_completed/);
  const billingTracker = readSource("src/components/analytics/billing-conversion-tracker.tsx");
  assert.match(billingPanel, /BillingConversionTracker/);
  assert.match(billingTracker, /subscription_checkout_completed/);
  assert.match(billingTracker, /subscription_checkout_cancelled/);
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

test("billing lifecycle analytics integration point exists without paddle coupling", () => {
  const lifecycle = readSource("src/lib/analytics/billing-lifecycle.ts");
  const serverEvents = readSource("src/lib/analytics/server-events.ts");
  assert.match(lifecycle, /trackBillingLifecycleEvent/);
  assert.match(lifecycle, /invoice_paid/);
  assert.match(lifecycle, /subscription_cancelled/);
  assert.match(serverEvents, /GA4_API_SECRET/);
  assert.match(serverEvents, /organization_id/);
  assert.ok(!existsSync(join(rootDir, "src/lib/stripe/webhooks.ts")));
});

test("consent-gated sinks use explicit marketing vs analytics categories", () => {
  const provider = readSource("src/components/analytics/analytics-provider.tsx");
  const events = readSource("src/lib/analytics/events.ts");
  const clarity = readSource("src/components/analytics/clarity-script.tsx");
  assert.match(provider, /hasAnalyticsConsent|hasMarketingConsent/);
  assert.match(provider, /registerAnalyticsSink\(\(name, props\) => ga4Sink\(name, props\), "marketing"\)/);
  assert.match(provider, /registerAnalyticsSink\(\(name, props\) => plausibleSink\(name, props\), "analytics"\)/);
  assert.match(events, /sink\.consent === "marketing"/);
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

test("dead duplicate PostHog provider is removed", () => {
  assert.ok(!existsSync(join(rootDir, "src/components/observability/posthog-provider.tsx")));
});

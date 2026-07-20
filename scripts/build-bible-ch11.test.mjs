import assert from "node:assert/strict";
import test from "node:test";
import {
  assertDocAndRule,
  pathExists,
  readSource,
} from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 11 analytics doc and rule exist", () => {
  const { doc, rule } = assertDocAndRule({
    docRelativePath: "docs/13_BUILD_BIBLE_V2_CHAPTER_11_ANALYTICS.md",
    ruleRelativePath: ".cursor/rules/build-bible-v2-ch11-analytics.mdc",
  });
  assert.match(doc, /Event bus \+ sanitize|billing-lifecycle/);
  assert.match(rule, /trackAITelemetryEvent/);
  assert.match(rule, /trackAnalyticsEvent/);
});

test("provider catalog and funnel stages are centralized", () => {
  const providers = readSource("src/lib/analytics/providers.ts");
  const funnel = readSource("src/lib/analytics/funnel.ts");
  const business = readSource("src/lib/analytics/business-events.ts");
  assert.match(providers, /ANALYTICS_PROVIDERS/);
  assert.match(providers, /gtm/);
  assert.match(funnel, /CONVERSION_FUNNEL_STAGES/);
  assert.match(funnel, /subscription_purchase/);
  assert.match(business, /BUSINESS_EVENTS/);
  assert.match(business, /PRODUCT_MODULES/);
});

test("sinks register with explicit consent categories", () => {
  const provider = readSource("src/components/analytics/analytics-provider.tsx");
  const events = readSource("src/lib/analytics/events.ts");
  assert.match(provider, /"marketing"/);
  assert.match(provider, /"analytics"/);
  assert.match(events, /AnalyticsSinkConsent/);
  assert.match(events, /sink\.consent === "marketing"/);
});

test("clarity sink does not mirror props as session tags", () => {
  const clarity = readSource("src/lib/analytics/clarity-events.ts");
  assert.match(clarity, /clarity\("event", name\)/);
  assert.doesNotMatch(clarity, /clarity\("set"/);
});

test("AI telemetry helper blocks prompt logging", () => {
  const ai = readSource("src/lib/analytics/ai-telemetry.ts");
  const events = readSource("src/lib/analytics/events.ts");
  assert.match(ai, /trackAITelemetryEvent/);
  assert.match(ai, /duration_ms/);
  assert.match(events, /"prompt"/);
  const generator = readSource("src/components/reports/ai/executive-summary-generator.tsx");
  assert.match(generator, /trackAITelemetryEvent/);
});

test("billing lifecycle integration point is paddle-agnostic", () => {
  const lifecycle = readSource("src/lib/analytics/billing-lifecycle.ts");
  assert.match(lifecycle, /trackBillingLifecycleEvent/);
  assert.doesNotMatch(lifecycle, /paddle/i);
  assert.doesNotMatch(lifecycle, /stripe/i);
});

test("portal login and features page use standardized events", () => {
  const portal = readSource("src/components/client-portal/portal-login-form.tsx");
  const features = readSource("src/app/(marketing)/features/page.tsx");
  assert.match(portal, /portal_login/);
  assert.match(features, /features_page_viewed/);
  assert.doesNotMatch(features, /cta_clicked/);
});

test("dead PostHog duplicate provider is removed", () => {
  assert.ok(!pathExists("src/components/observability/posthog-provider.tsx"));
});

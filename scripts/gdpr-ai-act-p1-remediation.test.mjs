/**
 * GDPR + EU AI Act 2026 P1 remediation — source-contract regressions.
 * No Production secrets. Narrow assertions only.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("AiDisclosure primitive exports Art.50 copy", () => {
  const disclosure = readSource("src/components/ai/ai-disclosure.tsx");
  const index = readSource("src/components/ai/index.ts");
  assert.match(disclosure, /AI-assisted/);
  assert.match(disclosure, /AI-generated · Verify before use/);
  assert.match(index, /AiDisclosure/);
});

test("generative AI surfaces include disclosure markers", () => {
  const surfaces = [
    "src/components/copilot/copilot-answer-panel.tsx",
    "src/components/reports/ai/report-assistant-panel.tsx",
    "src/components/reports/ai/executive-summary-generator.tsx",
    "src/components/ai-risks/risk-ai-section.tsx",
    "src/components/incidents/ai/incident-ai-section.tsx",
    "src/components/knowledge/knowledge-hub-workspace.tsx",
    "src/components/automation/automation-builder-workspace.tsx",
    "src/components/operational/ai/operational-assistant-panel.tsx",
    "src/components/executive-intelligence/executive-intelligence-hub.tsx",
  ];
  for (const path of surfaces) {
    const src = readSource(path);
    assert.match(
      src,
      /AiDisclosure|AI-assisted|AI-generated/,
      `${path} must disclose generative AI`,
    );
  }
});

test("newsletter requires unchecked marketing consent and fail-closed server gate", () => {
  const form = readSource("src/components/marketing/newsletter-signup-form.tsx");
  const actions = readSource("src/lib/sales/capture-actions.ts");
  assert.match(form, /name="marketingConsent"/);
  assert.match(form, /defaultChecked=\{false\}/);
  assert.match(form, /Privacy Policy|LEGAL_ROUTES\.privacy/);
  assert.match(actions, /submitNewsletterSignup/);
  assert.match(actions, /Please confirm marketing consent/);
  assert.match(actions, /isMarketingConsentGranted/);
  assert.match(actions, /consent_records|recordConsent|persistMarketingConsentEvidence/);
});

test("contact and pilot separate service communication from optional marketing", () => {
  const contact = readSource("src/components/marketing/contact-form.tsx");
  const pilot = readSource("src/components/marketing/pilot-application-form.tsx");
  const actions = readSource("src/lib/sales/capture-actions.ts");

  assert.match(contact, /service communication/);
  assert.match(contact, /Optional:/);
  assert.match(contact, /name="marketingConsent"/);
  assert.match(contact, /defaultChecked=\{false\}/);
  assert.doesNotMatch(contact, /name="marketingConsent"[^>]*required/);

  assert.match(pilot, /service communication/);
  assert.match(pilot, /Optional:/);
  assert.match(pilot, /name="marketingConsent"/);
  assert.match(pilot, /defaultChecked=\{false\}/);
  assert.doesNotMatch(pilot, /name="marketingConsent"[^>]*required/);

  assert.match(actions, /submitContactLead/);
  assert.match(actions, /submitPilotApplication/);
  assert.doesNotMatch(
    actions,
    /submitContactLead[\s\S]{0,800}Please confirm marketing consent/,
  );
});

test("public claims avoid absolute GDPR-ready and unqualified encryption-at-rest", () => {
  const faq = readSource("src/lib/marketing/faq-content.ts");
  const securityHighlights = readSource("src/lib/marketing/content.ts");
  const legal = readSource("src/lib/company/legal-content.ts");

  assert.doesNotMatch(faq, /Is Auroranexis GDPR-ready\?/);
  assert.doesNotMatch(faq, /answer:\s*`Yes\. The platform supports/);
  assert.match(faq, /Does Auroranexis support GDPR workflows\?/);
  assert.doesNotMatch(faq, /Platform data stores use encryption at rest\./);
  assert.match(faq, /provider platform controls|provider-managed|typically provide encryption at rest/);

  assert.doesNotMatch(securityHighlights, /Encryption in transit \(TLS\) and at rest for platform data stores\./);
  assert.match(legal, /provider-managed encryption at rest/);
  assert.match(legal, /simulation mode only/);
});

test("admin supabase client is server-only", () => {
  const admin = readSource("src/lib/supabase/admin.ts");
  assert.match(admin, /import ["']server-only["']/);
  assert.match(admin, /createAdminClient/);
});

test("analytics withdraw tears down optional trackers", () => {
  const provider = readSource("src/components/analytics/analytics-provider.tsx");
  const plausible = readSource("src/components/analytics/plausible-script.tsx");
  const clarity = readSource("src/components/analytics/clarity-script.tsx");

  assert.match(provider, /opt_out_capturing/);
  assert.match(provider, /removeGa4Scripts|ga4-script/);
  assert.match(provider, /!hasMarketingConsent\(\)/);
  assert.match(provider, /!hasAnalyticsConsent\(\)/);
  assert.match(plausible, /removePlausible|plausible-script/);
  assert.match(clarity, /removeClarity|clarity-script/);
});

test("server GA4 MP is fail-closed without marketing consent", () => {
  const server = readSource("src/lib/analytics/server-events.ts");
  const billing = readSource("src/lib/analytics/billing-lifecycle.ts");
  assert.match(server, /marketingConsentGranted/);
  assert.match(server, /if \(!options\?\.marketingConsentGranted\) return/);
  assert.match(billing, /marketingConsentGranted:\s*false/);
});

test("Sentry configs scrub PII and disable default PII", () => {
  const scrub = readSource("src/lib/observability/sentry-scrub.ts");
  const client = readSource("sentry.client.config.ts");
  const server = readSource("sentry.server.config.ts");
  assert.match(scrub, /sendDefaultPii:\s*false/);
  assert.match(scrub, /authorization|cookie/i);
  assert.match(client, /beforeSend/);
  assert.match(client, /scrubSentryEvent/);
  assert.match(server, /beforeSend/);
  assert.match(server, /scrubSentryEvent/);
});

test("AI literacy doc is registered and discoverable", () => {
  const registry = readSource("src/lib/docs/registry.ts");
  const help = readSource("src/lib/marketing/content.ts");
  const literacy = readSource("src/lib/docs/pages/extras.ts");
  const allowlist = readSource("src/lib/seo/public-dynamic-slug-allowlist.ts");
  const docsPage = readSource("src/app/docs/[slug]/page.tsx");
  const seoRoutes = readSource("src/lib/seo/routes.ts");
  const literacyBlock =
    literacy.match(/export const AI_LITERACY_DOC[\s\S]*?(?=export const |\n$)/)?.[0] ?? "";
  const docsSlugBlock =
    allowlist.match(/const DOC_SLUGS = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? "";
  assert.match(registry, /AI_LITERACY_DOC/);
  assert.match(registry, /slug:\s*"ai-literacy"/);
  assert.match(docsPage, /getAllDocSlugs\(\)/);
  assert.match(docsPage, /dynamicParams = false/);
  assert.match(help, /\/docs\/ai-literacy/);
  assert.match(seoRoutes, /DOC_PAGES/);
  assert.match(literacy, /slug:\s*"ai-literacy"/);
  assert.match(docsSlugBlock, /"ai-literacy"/);
  assert.doesNotMatch(docsSlugBlock, /"not-a-real-doc-slug"/);
  assert.match(literacyBlock, /not a training completion certificate/i);
  assert.doesNotMatch(literacyBlock, /you are now certified/i);
});

test("subprocessor inventory distinguishes activation statuses", () => {
  const inventory = readSource("src/lib/company/subprocessors-inventory.ts");
  assert.match(inventory, /ACTIVE/);
  assert.match(inventory, /OPTIONAL_CONFIGURABLE/);
  assert.match(inventory, /CODE_SUPPORTED_NOT_ACTIVE/);
  assert.match(inventory, /Google Analytics 4/);
  assert.match(inventory, /OpenAI/);
  assert.match(inventory, /Anthropic/);
  assert.match(inventory, /READY_FOR_EXTERNAL_LEGAL_REVIEW/);
  assert.match(inventory, /Mollie/);
});

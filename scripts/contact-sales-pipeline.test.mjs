import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("contact lead capture routes to sales@ and never fakes dual-path failure success", () => {
  const capture = readSource("src/lib/sales/capture-actions.ts");
  const notify = readSource("src/lib/sales/notify.ts");
  const stages = readSource("src/lib/sales/pipeline-stages.ts");
  const company = readSource("src/lib/company/company-contact.ts");
  const contactAction = readSource("src/lib/marketing/contact-action.ts");
  const migration = readSource("supabase/migrations/20250625000000_revenue_pipeline.sql");

  assert.match(company, /salesEmail: "sales@auroranexis\.com"/);
  assert.match(stages, /key: "sales"[\s\S]*email: SALES_EMAIL/);
  assert.match(stages, /case "contact":[\s\S]*return "sales"/);
  assert.match(contactAction, /submitContactLead/);
  assert.match(capture, /source: "contact"[\s\S]*inboxKey: "sales"/);
  assert.match(capture, /checkPublicFormThrottle/);
  assert.match(capture, /from\("sales_leads"\)\.insert/);
  assert.match(capture, /sendLeadNotificationEmail/);
  assert.match(capture, /persistFailed:\s*!persisted/);
  assert.match(capture, /Lead delivered by email only/);
  assert.match(capture, /Unable to save your submission/);
  assert.match(capture, /Lead persisted but notification email failed/);
  assert.match(notify, /const to = getInboxEmail\(input\.inboxKey\)/);
  assert.match(notify, /replyTo: input\.contactEmail/);
  assert.doesNotMatch(notify, /to: input\./);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.sales_leads/);
  assert.match(migration, /GRANT ALL ON TABLE public\.sales_leads TO service_role/);
});

test("public contact form surfaces action errors and only celebrates success state", () => {
  const form = readSource("src/components/marketing/contact-form.tsx");
  assert.match(form, /submitContactForm/);
  assert.match(form, /state\.success/);
  assert.match(form, /state\.error/);
  assert.match(form, /FormAlert variant="error"/);
  assert.match(form, /FormAlert variant="success"/);
});

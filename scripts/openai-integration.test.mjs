import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("phase 29 migration creates health checks and ai_request_logs with RLS and grants", () => {
  const migration = readSource("supabase/migrations/20250708000000_openai_platform_phase29.sql");
  assert.match(migration, /platform_openai_health_checks/);
  assert.match(migration, /ai_request_logs/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /GRANT SELECT ON public\.ai_request_logs TO authenticated/);
  assert.match(migration, /GRANT ALL ON TABLE public\.ai_request_logs TO service_role/);
  assert.match(migration, /GRANT ALL ON TABLE public\.platform_openai_health_checks TO service_role/);
});

test("OpenAI platform config parses AI_ENABLED and never exposes secrets", () => {
  const config = readSource("src/lib/ai/openai/config.ts");
  assert.match(config, /AI_ENABLED/);
  assert.match(config, /AI_PROVIDER/);
  assert.match(config, /OPENAI_API_KEY/);
  assert.match(config, /OPENAI_MODEL/);
  assert.doesNotMatch(config, /NEXT_PUBLIC_/);
  assert.doesNotMatch(config, /return.*apiKey/);
});

test("OpenAI client is server-only with lazy initialization", () => {
  const client = readSource("src/lib/ai/openai/client.ts");
  assert.match(client, /server-only/);
  assert.match(client, /lazy|cachedClient/);
  assert.doesNotMatch(client, /NEXT_PUBLIC_/);
});

test("Responses API is used for connection probe and structured output", () => {
  const responses = readSource("src/lib/ai/openai/responses.ts");
  assert.match(responses, /client\.responses\.create/);
  assert.match(responses, /runOpenAIConnectionProbe/);
  assert.match(responses, /runOpenAIStructuredResponse/);
  assert.match(responses, /json_schema/);
  assert.doesNotMatch(responses, /chat\.completions/);
  assert.doesNotMatch(responses, /assistants/);
});

test("public AI status uses persisted health state not env presence alone", () => {
  const publicStatus = readSource("src/lib/marketing/public-status.ts");
  const statusPage = readSource("src/app/(marketing)/status/page.tsx");
  assert.match(publicStatus, /getOpenAIPlatformStatus|getLiveStatusOverrides|resolvePublicOverallStatus/);
  assert.match(publicStatus, /getOpenAIPlatformConfig|OpenAI|openai/i);
  assert.doesNotMatch(publicStatus, /process\.env\.OPENAI_API_KEY/);
  assert.match(statusPage, /getLiveStatusOverrides/);
  assert.match(statusPage, /resolvePublicOverallStatus/);
  assert.match(statusPage, /MarketingShell/);
});

test("integration center uses real OpenAI platform snapshot and Responses API test", () => {
  const snapshot = readSource("src/lib/integrations/center/snapshot.ts");
  const actions = readSource("src/lib/integrations/center/actions.ts");
  const workspace = readSource("src/components/settings/integration-center-workspace.tsx");
  assert.match(snapshot, /getOpenAIIntegrationSnapshot/);
  assert.doesNotMatch(snapshot, /openaiApiKey/);
  assert.match(actions, /runOpenAIConnectionTest/);
  assert.doesNotMatch(actions, /provider\.health\(\)/);
  assert.doesNotMatch(actions, /OPENAI_API_KEY/);
  assert.match(workspace, /Last successful check/);
  assert.match(workspace, /No data available/);
});

test("executive summary feature uses structured schema and review workflow", () => {
  const schema = readSource("src/lib/ai/executive-summary/schema.ts");
  const action = readSource("src/lib/ai/executive-summary/action.ts");
  const ui = readSource("src/components/reports/ai/executive-summary-generator.tsx");
  assert.match(schema, /headline/);
  assert.match(schema, /executive_summary/);
  assert.match(schema, /key_outcomes/);
  assert.match(schema, /confidence_note/);
  assert.match(action, /runOpenAIStructuredResponse/);
  assert.match(action, /canEditReport/);
  assert.match(action, /assertCanUseFeature/);
  assert.match(action, /organization_id/);
  assert.match(action, /checkOpenAIGenerationLimits/);
  assert.match(action, /recordOpenAIRequestLog/);
  assert.doesNotMatch(action, /autoPublish|publishReport|\.publish\(/);
  assert.match(ui, /Generate executive summary/);
  assert.match(ui, /Apply to executive summary/);
  assert.match(ui, /was not overwritten/);
});

test("rate limits are Supabase-backed not in-memory only", () => {
  const rateLimit = readSource("src/lib/ai/openai/rate-limit.ts");
  assert.match(rateLimit, /countRecentOpenAIRequests/);
  assert.match(rateLimit, /organizationId/);
  assert.doesNotMatch(rateLimit, /rateLimitStore|new Map\(/);
});

test("analytics events for AI are privacy-safe", () => {
  const events = readSource("src/lib/analytics/events.ts");
  assert.match(events, /ai_connection_test_started/);
  assert.match(events, /ai_summary_generation_succeeded/);
  assert.match(events, /ai_rate_limit_reached/);
  const generator = readSource("src/components/reports/ai/executive-summary-generator.tsx");
  assert.doesNotMatch(generator, /provider_request_id/);
  assert.doesNotMatch(generator, /prompt/);
});

test("OpenAI errors are classified without leaking secrets", () => {
  const errors = readSource("src/lib/ai/openai/errors.ts");
  const types = readSource("src/lib/ai/openai/types.ts");
  assert.match(errors, /authentication/);
  assert.match(errors, /rate_limited/);
  assert.match(errors, /quota_or_billing/);
  assert.match(types, /malformed_output/);
  assert.doesNotMatch(errors, /process\.env\.OPENAI_API_KEY/);
});

test("status derivation maps connected degraded and unknown states", () => {
  const status = readSource("src/lib/ai/openai/status.ts");
  assert.match(status, /connected/);
  assert.match(status, /degraded/);
  assert.match(status, /Unknown/);
  assert.match(status, /HEALTH_TTL_MS/);
});

test("German and English organization language paths exist in executive summary prompts", () => {
  const prompts = readSource("src/lib/ai/executive-summary/prompts.ts");
  const action = readSource("src/lib/ai/executive-summary/action.ts");
  assert.match(prompts, /German/);
  assert.match(prompts, /English/);
  assert.match(action, /getStoredOrganizationLanguage/);
});

test("request logs exclude raw prompts and responses", () => {
  const requestLog = readSource("src/lib/ai/openai/request-log.ts");
  assert.doesNotMatch(requestLog, /raw_prompt/);
  assert.doesNotMatch(requestLog, /raw_response/);
  assert.doesNotMatch(requestLog, /outputText/);
  assert.match(requestLog, /feature/);
  assert.match(requestLog, /prompt_version/);
});

test("package.json exposes openai integration test script", () => {
  const pkg = readSource("package.json");
  assert.match(pkg, /test:openai-integration/);
});

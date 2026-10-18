import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("instrumentation wires onRequestError to Sentry.captureRequestError", () => {
  const instrumentation = readSource("src/instrumentation.ts");
  assert.match(instrumentation, /from "@sentry\/nextjs"/);
  assert.match(instrumentation, /export const onRequestError\s*=\s*Sentry\.captureRequestError/);
  assert.match(instrumentation, /sentry\.server\.config/);
});

test("Sentry privacy: sendDefaultPii false and beforeSend scrubbing", () => {
  const scrub = readSource("src/lib/observability/sentry-scrub.ts");
  const client = readSource("sentry.client.config.ts");
  const server = readSource("sentry.server.config.ts");

  assert.match(scrub, /sendDefaultPii:\s*false/);
  assert.match(scrub, /request\.data\s*=\s*"\[redacted\]"/);
  assert.match(scrub, /request\.cookies\s*=\s*"\[redacted\]"/);
  assert.match(scrub, /query_string\s*=\s*"\[redacted\]"/);
  assert.match(scrub, /ip_address:\s*undefined/);
  assert.match(client, /beforeSend/);
  assert.match(client, /scrubSentryEvent/);
  assert.match(client, /\.\.\.SENTRY_PRIVACY_INIT/);
  assert.match(server, /beforeSend/);
  assert.match(server, /scrubSentryEvent/);
  assert.match(server, /\.\.\.SENTRY_PRIVACY_INIT/);
});

test("observability captureException forwards to Sentry.captureException", () => {
  const capture = readSource("src/lib/observability/capture.ts");
  assert.match(capture, /from "@sentry\/nextjs"/);
  assert.match(capture, /Sentry\.captureException/);
  assert.match(capture, /scope\.setTag/);
  assert.doesNotMatch(capture, /Sentry forwarding skipped \(SDK not wired\)/);
});

test("resolveActionError reports unexpected errors to Sentry with route tag", () => {
  const actionErrors = readSource("src/lib/action-errors.ts");
  assert.match(actionErrors, /\[action\] unexpected error:/);
  assert.match(actionErrors, /captureException/);
  assert.match(actionErrors, /tags:\s*\{[\s\S]*route:/);
  assert.match(actionErrors, /area:\s*"server_action"/);
});

test("contact lead failures are captured with area=contact", () => {
  const capture = readSource("src/lib/sales/capture-actions.ts");
  assert.match(capture, /captureException/);
  assert.match(capture, /area:\s*"contact"/);
  assert.match(capture, /Contact lead capture failed/);
  assert.match(capture, /tags:\s*\{\s*area:\s*"contact"/);
});

test("next.config does not wrap withSentryConfig (documented gap; instrumentation still captures)", () => {
  const nextConfig = readSource("next.config.ts");
  assert.doesNotMatch(nextConfig, /withSentryConfig/);
});

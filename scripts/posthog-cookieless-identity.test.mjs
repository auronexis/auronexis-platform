/**
 * PostHog: cookieless page-view counting without consent, full mode only with consent,
 * pseudonymous identification of signed-in users, internal-traffic flag, trial_started event.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/posthog-cookieless-identity.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { isInternalAnalyticsUser } = await import("@/lib/analytics/internal");

describe("PostHog cookieless mode", () => {
  it("runs cookieless without consent and with cookies only after consent", () => {
    const provider = readSource("src/components/analytics/analytics-provider.tsx");
    assert.match(provider, /cookieless_mode: "on_reject"/);
    assert.match(provider, /opt_out_capturing_by_default: !consented/);
    assert.match(provider, /disable_session_recording: !consented/);
    for (const option of ["autocapture", "capture_heatmaps", "capture_dead_clicks", "rageclick"]) {
      assert.match(provider, new RegExp(`${option}: consented`));
    }
    assert.match(provider, /posthog\.opt_out_capturing\?\.\(\)/);
    assert.match(provider, /posthog\.opt_in_capturing\?\.\(\)/);
    assert.match(provider, /posthog\.reset\?\.\(\)/);
  });

  it("without consent only a PostHog page view is sent; other tools and custom events stay consent-gated", () => {
    const tracker = readSource("src/components/analytics/page-view-tracker.tsx");
    assert.match(tracker, /if \(!hasAnalyticsConsent\(\)\) \{[\s\S]*?capturePostHogPageview\(\);\s*return;/);
    const gate = readSource("src/lib/analytics/consent-gate.ts");
    assert.match(gate, /hasAnalyticsConsent\(\)/);
    const provider = readSource("src/components/analytics/analytics-provider.tsx");
    assert.match(provider, /if \(!hasMarketingConsent\(\)\) \{\s*removeGa4Scripts\(\);/);
  });

  it("privacy texts describe the cookieless counting", () => {
    const legal = readSource("src/lib/company/legal-content.ts");
    assert.match(legal, /count page views anonymously with PostHog in cookieless mode/);
    assert.match(legal, /Art\. 6\(1\)\(f\) GDPR\)\. Marketing conversion tools/);
    assert.match(readSource("src/components/consent/cookie-consent-banner.tsx"), /count page views anonymously, without cookies/);
  });
});

describe("identification and internal traffic", () => {
  it("identifies only with consent, by internal user id, never by email", () => {
    const identity = readSource("src/lib/analytics/identity.ts");
    assert.match(identity, /!hasAnalyticsConsent\(\)\) return;/);
    assert.match(identity, /posthog\.identify\(currentIdentity\.userId/);
    assert.match(identity, /\$internal_or_test_user: currentIdentity\.isInternal/);
    assert.doesNotMatch(identity, /email/);
    const layout = readSource("src/app/(dashboard)/layout.tsx");
    assert.match(layout, /<AnalyticsIdentity\s+userId=\{session\.user\.id\}/);
  });

  it("flags the owner's workspaces and auroranexis.com addresses as internal", () => {
    assert.equal(isInternalAnalyticsUser({ organizationId: "b1fd9e76-9f6a-470d-b7d5-c0f014360504", email: "x@gmail.com" }), true);
    assert.equal(isInternalAnalyticsUser({ organizationId: "00000000-0000-4000-8000-000000000000", email: "ops@auroranexis.com" }), true);
    assert.equal(isInternalAnalyticsUser({ organizationId: "00000000-0000-4000-8000-000000000000", email: "ops@agency.co.uk" }), false);
  });

  it("tracks trial_started after a signup that started a trial", () => {
    const login = readSource("src/app/(auth)/login/page.tsx");
    assert.match(login, /params\.trial === "started"[\s\S]*?<ConversionTracker event="trial_started"/);
    assert.match(readSource("src/lib/analytics/taxonomy.ts"), /"trial_started",\n  "workspace_created"/);
  });
});

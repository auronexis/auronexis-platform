import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("CSP allows Microsoft Clarity script host scripts.clarity.ms", () => {
  const csp = readSource("src/lib/security/csp.ts");
  assert.match(csp, /https:\/\/scripts\.clarity\.ms/);
  assert.match(csp, /https:\/\/\*\.clarity\.ms/);
  assert.match(csp, /https:\/\/www\.clarity\.ms/);
});

test("CSP allows Microsoft Clarity connection endpoints", () => {
  const csp = readSource("src/lib/security/csp.ts");
  assert.match(csp, /connect-src[\s\S]*https:\/\/\*\.clarity\.ms/);
  assert.match(csp, /connect-src[\s\S]*https:\/\/c\.bing\.com/);
});

test("CSP does not introduce broad script-src or connect-src wildcards", () => {
  const csp = readSource("src/lib/security/csp.ts");
  const policy = csp.match(/export function buildContentSecurityPolicy[\s\S]*/)?.[0] ?? "";
  assert.doesNotMatch(policy, /script-src[^;]*\shttps:\s/);
  assert.doesNotMatch(policy, /script-src[^;]*\s\*\s/);
  assert.doesNotMatch(policy, /connect-src[^;]*\shttps:\s/);
  assert.doesNotMatch(policy, /connect-src[^;]*\s\*\s/);
});

test("vercel.json CSP stays aligned with csp.ts for Clarity hosts", () => {
  const vercel = readSource("vercel.json");
  assert.match(vercel, /https:\/\/scripts\.clarity\.ms/);
  assert.match(vercel, /https:\/\/\*\.clarity\.ms/);
  assert.match(vercel, /https:\/\/c\.bing\.com/);
});

test("existing analytics providers remain in CSP", () => {
  const csp = readSource("src/lib/security/csp.ts");
  const providers = [
    "https://us.i.posthog.com",
    "https://us-assets.i.posthog.com",
    "https://eu.i.posthog.com",
    "https://plausible.io",
    "https://www.googletagmanager.com",
    "https://region1.google-analytics.com",
    "https://www.google-analytics.com",
    "https://challenges.cloudflare.com",
  ];
  for (const host of providers) {
    assert.match(csp, new RegExp(host.replace(/\./g, "\\.")));
  }
});

test("Clarity script is injected only once with consent gating", () => {
  const clarity = readSource("src/components/analytics/clarity-script.tsx");
  const provider = readSource("src/components/analytics/analytics-provider.tsx");
  assert.match(clarity, /getElementById\("clarity-script"\)/);
  assert.match(clarity, /hasAnalyticsConsent/);
  assert.match(clarity, /ANALYTICS_CONFIG\.clarity/);
  assert.equal((provider.match(/<ClarityScript/g) ?? []).length, 1);
});

test("Clarity project ID remains environment-driven", () => {
  const config = readSource("src/lib/analytics/config.ts");
  const clarity = readSource("src/components/analytics/clarity-script.tsx");
  assert.match(config, /NEXT_PUBLIC_CLARITY_PROJECT_ID/);
  assert.doesNotMatch(clarity, /xjo4otn1gx/);
  assert.doesNotMatch(config, /xjo4otn1gx/);
});

test("Clarity loads only in production analytics runtime", () => {
  const config = readSource("src/lib/analytics/config.ts");
  assert.match(config, /isProductionAnalyticsRuntime/);
});

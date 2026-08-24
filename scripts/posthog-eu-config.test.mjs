import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

const POSTHOG_EU_API = "https://eu.i.posthog.com";
const POSTHOG_EU_ASSETS = "https://eu-assets.i.posthog.com";
const POSTHOG_US_HOSTS = [
  "https://us.i.posthog.com",
  "https://us-assets.i.posthog.com",
];

test("PostHog defaults to EU Cloud api host when env host is unset", () => {
  const config = readSource("src/lib/analytics/config.ts");
  assert.match(config, /POSTHOG_EU_API_HOST = "https:\/\/eu\.i\.posthog\.com"/);
  assert.match(config, /POSTHOG_EU_ASSET_HOST = "https:\/\/eu-assets\.i\.posthog\.com"/);
  assert.match(config, /posthogApiHost = process\.env\.NEXT_PUBLIC_POSTHOG_HOST\?\.trim\(\) \|\| POSTHOG_EU_API_HOST/);
  assert.doesNotMatch(config, /https:\/\/us\.i\.posthog\.com/);
});

test("PostHog init passes EU api_host and asset_host", () => {
  const provider = readSource("src/components/analytics/analytics-provider.tsx");
  assert.match(provider, /api_host: host/);
  assert.match(provider, /asset_host: assetHost/);
  assert.match(provider, /ANALYTICS_CONFIG\.posthog\.assetHost/);
});

test("CSP allows only EU PostHog script and connect endpoints", () => {
  const csp = readSource("src/lib/security/csp.ts");
  assert.match(csp, new RegExp(POSTHOG_EU_API.replace(/\./g, "\\.")));
  assert.match(csp, new RegExp(POSTHOG_EU_ASSETS.replace(/\./g, "\\.")));
  for (const host of POSTHOG_US_HOSTS) {
    assert.doesNotMatch(csp, new RegExp(host.replace(/\./g, "\\.")));
  }
});

test("vercel.json CSP stays aligned with csp.ts for PostHog EU hosts", () => {
  const vercel = readSource("vercel.json");
  assert.match(vercel, new RegExp(POSTHOG_EU_API.replace(/\./g, "\\.")));
  assert.match(vercel, new RegExp(POSTHOG_EU_ASSETS.replace(/\./g, "\\.")));
  for (const host of POSTHOG_US_HOSTS) {
    assert.doesNotMatch(vercel, new RegExp(host.replace(/\./g, "\\.")));
  }
});

test(".env.example documents EU PostHog host", () => {
  const example = readSource(".env.example");
  assert.match(example, /NEXT_PUBLIC_POSTHOG_HOST=https:\/\/eu\.i\.posthog\.com/);
  assert.doesNotMatch(example, /NEXT_PUBLIC_POSTHOG_HOST=https:\/\/us\.i\.posthog\.com/);
});

test("PostHog key env var is referenced without hard-coded secrets", () => {
  const config = readSource("src/lib/analytics/config.ts");
  assert.match(config, /NEXT_PUBLIC_POSTHOG_KEY/);
  assert.doesNotMatch(config, /phc_[a-zA-Z0-9]+/);
});

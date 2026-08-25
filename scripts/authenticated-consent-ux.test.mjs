/**
 * Authenticated consent UX — compact card on app/portal shells; no full-width megabar.
 * Consent storage/semantics remain unchanged.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("consent storage contract remains unchanged", () => {
  const types = readSource("src/lib/consent/types.ts");
  const storage = readSource("src/lib/consent/storage.ts");

  assert.match(types, /CONSENT_STORAGE_KEY = "auroranexis:cookie-consent"/);
  assert.match(types, /CONSENT_VERSION = 1/);
  assert.match(types, /analytics: boolean/);
  assert.match(types, /marketing: boolean/);
  assert.match(storage, /localStorage\.getItem\(CONSENT_STORAGE_KEY\)/);
  assert.match(storage, /localStorage\.setItem\(CONSENT_STORAGE_KEY/);
  assert.match(storage, /acceptAllConsent/);
  assert.match(storage, /rejectNonEssentialConsent/);
  assert.match(storage, /DEFAULT_CONSENT/);
  assert.match(storage, /ALL_ACCEPTED_CONSENT/);
});

test("authenticated consent presentation is a compact card not inset-x-0 megabar", () => {
  const banner = readSource("src/components/consent/cookie-consent-banner.tsx");

  assert.match(banner, /dashboard-root/);
  assert.match(banner, /portal-root/);
  assert.match(banner, /data-consent-surface=\{authenticatedSurface \? "authenticated" : "public"\}/);
  assert.match(banner, /sm:max-w-sm/);
  assert.match(banner, /sm:right-6/);
  assert.match(banner, /rounded-2xl/);
  assert.match(banner, /Reject non-essential/);
  assert.match(banner, /Accept all/);
  assert.match(banner, /Manage/);
  assert.match(banner, /acceptAllConsent\("banner"\)/);
  assert.match(banner, /rejectNonEssentialConsent\("banner"\)/);
  assert.match(banner, /CookiePreferencesModal/);

  // Authenticated branch must not use full-bleed inset-x-0; public may retain it.
  const authBranch =
    banner.match(/authenticatedSurface\s*\?\s*\[([\s\S]*?)\]\s*:\s*\[/)?.[1] ?? "";
  assert.ok(authBranch.length > 0, "authenticated class branch must exist");
  assert.doesNotMatch(authBranch, /inset-x-0/);
  assert.match(authBranch, /max-w-sm/);
});

test("public consent strip retains bottom chrome for marketing surfaces", () => {
  const banner = readSource("src/components/consent/cookie-consent-banner.tsx");
  const publicBranch =
    banner.match(/authenticatedSurface\s*\?\s*\[[\s\S]*?\]\s*:\s*\[([\s\S]*?)\]\s*,?\s*\)/)?.[1] ?? "";
  assert.ok(publicBranch.length > 0, "public class branch must exist");
  assert.match(publicBranch, /inset-x-0/);
  assert.match(publicBranch, /bottom-0/);
});

test("PostHog and analytics remain consent-gated", () => {
  const provider = readSource("src/components/analytics/analytics-provider.tsx");
  const consentGate = readSource("src/lib/analytics/consent-gate.ts");

  assert.match(provider, /hasAnalyticsConsent/);
  assert.match(provider, /capture_pageview:\s*false/);
  assert.match(consentGate, /hasAnalyticsConsent/);
  assert.match(consentGate, /isProductionAnalyticsRuntime/);
});

test("SiteFooter minimal remediation remains intact", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";
  assert.doesNotMatch(minimal, /bg-surface\/40/);
  assert.doesNotMatch(minimal, /grid gap-8/);
  assert.match(minimal, /FOOTER_LINKS\.map/);
});

/**
 * GA4 must record the landing page of every visit, and must never receive auth codes or
 * other private query parameters.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/ga4-pageview.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const events = await import("@/lib/analytics/events");

test("ga4PageLocation keeps campaign and click ids only", () => {
  assert.equal(
    events.ga4PageLocation("https://www.auroranexis.com/pricing?utm_source=bing&code=secret&gclid=abc&q=x"),
    "https://www.auroranexis.com/pricing?utm_source=bing&gclid=abc",
  );
  assert.equal(
    events.ga4PageLocation("https://www.auroranexis.com/auth/callback?code=secret&next=/dashboard"),
    "https://www.auroranexis.com/auth/callback",
  );
  assert.equal(events.ga4PageLocation("https://www.auroranexis.com/"), "https://www.auroranexis.com/");
});

test("captureGa4Pageview sends one page_view for the current page once gtag exists", () => {
  const calls = [];
  globalThis.document = { title: "Pricing | Auroranexis" };
  globalThis.window = {
    location: { href: "https://www.auroranexis.com/pricing?utm_medium=organic&token=x", pathname: "/pricing" },
    gtag: (...args) => calls.push(args),
  };
  try {
    events.captureGa4Pageview();
    events.ga4Sink("page_view", { path: "/pricing", surface: "marketing" }); // same URL, deduped
    assert.equal(calls.length, 1);
    const [kind, name, params] = calls[0];
    assert.equal(kind, "event");
    assert.equal(name, "page_view");
    assert.equal(params.page_path, "/pricing");
    assert.equal(params.page_location, "https://www.auroranexis.com/pricing?utm_medium=organic");
    assert.equal(params.page_title, "Pricing | Auroranexis");
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("GA4 loader records the current page right after gtag is configured", () => {
  const provider = readSource("src/components/analytics/analytics-provider.tsx");
  const init = provider.match(/function initGa4\(\)[\s\S]*?\n}\n/)?.[0] ?? "";
  assert.match(init, /send_page_view:false/);
  assert.ok(init.indexOf("captureGa4Pageview()") > init.indexOf("appendChild(inline)"));
});

test("every public lead form reports generate_lead after a successful submit", () => {
  const hook = readSource("src/components/marketing/use-resilient-form-action.ts");
  assert.match(hook, /if \(result\.success\) \{\s*if \(leadForm\) trackAnalyticsEvent\("generate_lead", \{ form: leadForm \}\);/);
  const forms = {
    "contact-form": "contact",
    "pilot-application-form": "pilot",
    "demo-booking-form": "demo",
    "referral-lead-form": "referral",
    "newsletter-signup-form": "newsletter",
  };
  for (const [file, name] of Object.entries(forms)) {
    const source = readSource(`src/components/marketing/${file}.tsx`);
    assert.match(source, new RegExp(`useResilientFormAction\\([A-Za-z]+, "${name}"\\)`), file);
  }
});

/**
 * Common legal/company URL guesses redirect instead of returning 404, the home meta
 * description stays within Bing's 25–160 character range, the IndexNow key file is
 * served from the site root, and the Product Hunt badge also shows in the app footer.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/seo-redirects-badge.test.mjs
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("common URL guesses redirect permanently to existing pages", () => {
  const config = JSON.parse(readSource("vercel.json"));
  const expected = {
    "/terms-of-service": "/terms",
    "/privacy-policy": "/privacy",
    "/about-us": "/about",
    "/contact-us": "/contact",
    "/founders": "/about",
  };
  for (const [source, destination] of Object.entries(expected)) {
    const rule = config.redirects.find((entry) => entry.source === source);
    assert.ok(rule, `missing redirect for ${source}`);
    assert.equal(rule.destination, destination);
    assert.equal(rule.permanent, true);
  }
});

test("home meta description fits Bing's length range", () => {
  const routes = readSource("src/lib/seo/routes.ts");
  const match = routes.match(/\[MARKETING_ROUTES\.home\]:\s*\{[\s\S]*?description:\s*"([^"]+)"/);
  assert.ok(match, "home description not found");
  const length = match[1].length;
  assert.ok(length >= 120 && length <= 155, `home description is ${length} characters`);
});

test("IndexNow key file exists and contains only its key", () => {
  const files = readdirSync("public").filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));
  assert.equal(files.length, 1);
  const key = files[0].replace(/\.txt$/, "");
  assert.equal(readFileSync(`public/${files[0]}`, "utf8"), key);
});

test("Product Hunt badge renders in the authenticated app footer", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";
  assert.match(minimal, /PRODUCT_HUNT_BADGE_SRC_DARK/);
  assert.match(minimal, /rel="noopener noreferrer"/);
});

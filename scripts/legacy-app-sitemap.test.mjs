/**
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/legacy-app-sitemap.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("legacy sitemap lists only old app.auroranexis.com URLs", () => {
  const xml = readSource("public/sitemap-legacy-app.xml");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0);
  for (const loc of locs) {
    assert.match(loc, /^https:\/\/app\.auroranexis\.com\//, loc);
  }
  assert.equal(new Set(locs).size, locs.length, "no duplicates");
});

test("legacy sitemap is not advertised in robots.txt (submitted in Search Console only)", () => {
  const robots = readSource("src/app/robots.ts");
  assert.doesNotMatch(robots, /sitemap-legacy-app/);
});

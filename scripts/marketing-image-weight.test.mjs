/**
 * Every marketing page loads the header logo, and the homepage paints the hero banner as its
 * largest element (LCP). Both used to be 1–1.7 MB PNGs, which pushed mobile LCP past 15 seconds.
 * These tests keep the files small and the hero discoverable early.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/marketing-image-weight.test.mjs
 */
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { describe, it } from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

const { BRANDING_ASSETS } = await import("@/lib/branding/assets");

const sizeOf = (publicPath) => statSync(`public${publicPath}`).size;

describe("marketing image weight", () => {
  it("serves the hero banner as a small WebP", () => {
    assert.match(BRANDING_ASSETS.heroBanner, /\.webp$/);
    assert.ok(sizeOf(BRANDING_ASSETS.heroBanner) < 200 * 1024, "hero banner must stay under 200 kB");
  });

  it("keeps the header logo small", () => {
    assert.ok(sizeOf(BRANDING_ASSETS.logoHorizontalTransparent) < 100 * 1024, "header logo must stay under 100 kB");
  });

  it("renders the hero as a priority image, not a CSS background", () => {
    const hero = readSource("src/components/marketing/marketing-hero.tsx");
    assert.match(hero, /src=\{BRANDING_ASSETS\.heroBanner\}/);
    assert.match(hero, /\bpriority\b/);
    assert.doesNotMatch(hero, /backgroundImage/);
  });
});

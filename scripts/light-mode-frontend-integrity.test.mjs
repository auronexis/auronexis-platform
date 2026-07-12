import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

test("repository does not ship Cently extension scripts", () => {
  const patterns = [
    "redirectionChainSiteScript.js",
    "cently:rd:site",
    "contentScript.js",
  ];
  for (const pattern of patterns) {
    assert.doesNotMatch(readSource("package.json"), new RegExp(pattern));
  }
});

test("repository does not monkey-patch window.location", () => {
  const srcRoots = ["src", "scripts"];
  for (const root of srcRoots) {
    const path = join(rootDir, root);
    if (!existsSync(path)) continue;
  }
  assert.doesNotMatch(readSource("src/app/layout.tsx"), /defineProperty\(window\.location/);
  assert.doesNotMatch(readSource("src/components/analytics/analytics-provider.tsx"), /defineProperty\(window\.location/);
});

test("globals define light and dark color-scheme tokens", () => {
  const css = readSource("src/app/globals.css");
  assert.match(css, /color-scheme:\s*light/);
  assert.match(css, /html\.dark[\s\S]*color-scheme:\s*dark/);
  assert.match(css, /--color-danger:/);
  assert.match(css, /--color-background:/);
});

test("marketing pages prevent light body gradient bleed during scroll", () => {
  const css = readSource("src/app/globals.css");
  assert.match(css, /html:has\(\.marketing-theme\) body/);
  assert.match(css, /background-image:\s*none/);
});

test("no global console or error suppression hacks", () => {
  const layout = readSource("src/app/layout.tsx");
  assert.doesNotMatch(layout, /console\.warn\s*=\s*/);
  assert.doesNotMatch(layout, /window\.onerror\s*=/);
});

test("no blanket translateZ GPU workaround in global CSS", () => {
  const css = readSource("src/app/globals.css");
  assert.doesNotMatch(css, /translateZ\(0\)/);
  assert.doesNotMatch(css, /translate3d\(0,\s*0,\s*0\)/);
});

test("theme provider uses single documentElement class strategy", () => {
  const prefs = readSource("src/lib/profile/preferences.ts");
  const layout = readSource("src/app/layout.tsx");
  assert.match(prefs, /classList\.remove\("light", "dark"\)/);
  assert.match(layout, /auroranexis:user-preferences/);
  assert.doesNotMatch(layout, /ThemeProvider/);
});

test("public favicon assets remain present", () => {
  const favicon = join(rootDir, "public", "favicon.ico");
  assert.ok(existsSync(favicon));
  assert.ok(statSync(favicon).size > 100);
});

test("no global w-screen on root dashboard shell", () => {
  const shell = readSource("src/components/layout/dashboard-shell.tsx");
  assert.doesNotMatch(shell, /w-screen/);
  assert.doesNotMatch(shell, /100vw/);
});

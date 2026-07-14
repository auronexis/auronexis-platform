import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

function extractH1ClassNames(source) {
  const match = source.match(/<h1[^>]*className="([^"]+)"/);
  return match ? match[1] : "";
}

test("signup page uses shared auth branding shell instead of dark-on-dark card layout", () => {
  const page = readSource("src/app/(auth)/signup/page.tsx");
  assert.match(page, /LoginBrandingShell/);
  assert.match(page, /WhiteLabelThemeInjector/);
  assert.match(page, /resolveAuthBranding/);
  assert.doesNotMatch(page, /bg-surface-1/);
  assert.doesNotMatch(page, /text-navy-950/);
  assert.doesNotMatch(page, /bg-navy-950/);
});

test("signup H1 uses readable auth-page text token, not navy-950", () => {
  const form = readSource("src/components/auth/signup-form.tsx");
  const h1Classes = extractH1ClassNames(form);
  assert.match(h1Classes, /text-slate-950/);
  assert.doesNotMatch(h1Classes, /text-navy-950/);
  assert.doesNotMatch(h1Classes, /text-foreground/);
});

test("signup subtitle and labels use approved readable auth tokens", () => {
  const form = readSource("src/components/auth/signup-form.tsx");
  assert.match(form, /text-slate-700/);
  assert.match(form, /labelClassName/);
  assert.match(form, /inputClassName/);
  assert.match(form, /text-slate-600/);
});

test("signup form forces light color scheme on dark auth shell", () => {
  const form = readSource("src/components/auth/signup-form.tsx");
  assert.match(form, /\[color-scheme:light\]/);
  assert.match(form, /text-slate-950/);
});

test("signup primary CTA and sign-in link remain readable", () => {
  const form = readSource("src/components/auth/signup-form.tsx");
  assert.match(form, /bg-blue-600[\s\S]*text-white/);
  assert.match(form, /text-blue-600/);
});

test("signup page keeps legal footer links outside the contrast-isolated card", () => {
  const page = readSource("src/app/(auth)/signup/page.tsx");
  assert.match(page, /LegalLinksInline/);
  assert.match(page, /footer=\{/);
});

test("signup retains conversion analytics instrumentation", () => {
  const page = readSource("src/app/(auth)/signup/page.tsx");
  const form = readSource("src/components/auth/signup-form.tsx");
  assert.match(page, /signup_started/);
  assert.match(form, /signup_started/);
  assert.match(form, /signup_completed/);
});

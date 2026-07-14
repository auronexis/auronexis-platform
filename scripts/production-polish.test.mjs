import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(relativePath) {
  return readFileSync(join(rootDir, relativePath), "utf8");
}

function publicAssetExists(relativePath) {
  const fullPath = join(rootDir, "public", relativePath.replace(/^\//, ""));
  return existsSync(fullPath) && statSync(fullPath).size > 0;
}

function extractIconUrlsFromSource(source) {
  const urls = new Set();
  for (const match of source.matchAll(/["'](\/(?:favicon\.ico|favicon\.svg|apple-icon\.png|icon-512-compact\.png)[^"']*)["']/g)) {
    urls.add(match[1]);
  }
  return [...urls];
}

// --- Favicon ---

test("favicon.ico exists and is non-empty", () => {
  const path = join(rootDir, "public", "favicon.ico");
  assert.ok(existsSync(path), "public/favicon.ico must exist");
  assert.ok(statSync(path).size > 100, "favicon.ico must be non-empty");
});

test("compact favicon svg source exists", () => {
  const path = join(rootDir, "public", "favicon.svg");
  assert.ok(existsSync(path));
  const content = readFileSync(path, "utf8");
  assert.match(content, /<svg/);
});

test("branding SSOT references favicon.ico as primary favicon", () => {
  const assets = readSource("src/lib/branding/assets.ts");
  assert.match(assets, /favicon: "\/favicon\.ico"/);
});

test("metadata icons reference existing local assets", () => {
  const assets = readSource("src/lib/branding/assets.ts");
  const icons = readSource("src/lib/branding/icons.ts");
  const metadata = readSource("src/lib/branding/metadata.ts");
  const urls = [
    ...extractIconUrlsFromSource(assets),
    ...extractIconUrlsFromSource(icons),
    ...extractIconUrlsFromSource(metadata),
  ];
  const unique = [...new Set(urls)];
  assert.ok(unique.length > 0, "expected icon URLs in metadata sources");
  for (const url of unique) {
    assert.ok(publicAssetExists(url), `${url} must exist in public/`);
  }
});

// --- Manifest ---

test("manifest implementation exists", () => {
  const manifest = readSource("src/app/manifest.ts");
  assert.match(manifest, /export default function manifest/);
  assert.match(manifest, /PLATFORM_MANIFEST_ICONS/);
});

test("manifest icon paths exist", () => {
  const icons = readSource("src/lib/branding/icons.ts");
  const manifest = readSource("src/app/manifest.ts");
  const urls = extractIconUrlsFromSource(icons);
  for (const url of urls) {
    assert.ok(publicAssetExists(url), `manifest icon ${url} must exist`);
  }
  assert.match(manifest, /icons: PLATFORM_MANIFEST_ICONS/);
});

test("apple touch icon png exists", () => {
  assert.ok(publicAssetExists("/apple-icon.png"));
});

// --- Autocomplete ---

test("login email uses email autocomplete", () => {
  const source = readSource("src/components/auth/login-form.tsx");
  assert.match(source, /name="email"[\s\S]*autoComplete="email"/);
});

test("login password uses current-password autocomplete", () => {
  const source = readSource("src/components/auth/login-form.tsx");
  assert.match(source, /name="password"[\s\S]*autoComplete="current-password"/);
});

test("signup password uses new-password autocomplete", () => {
  const source = readSource("src/components/auth/signup-form.tsx");
  assert.match(source, /name="password"[\s\S]*autoComplete="new-password"/);
});

test("signup page avoids dark-on-dark heading regression", () => {
  const page = readSource("src/app/(auth)/signup/page.tsx");
  const form = readSource("src/components/auth/signup-form.tsx");
  assert.match(page, /LoginBrandingShell/);
  assert.doesNotMatch(page, /text-navy-950/);
  assert.match(form, /<h1[^>]*className="[^"]*text-slate-950/);
  assert.match(form, /\[color-scheme:light\]/);
});

test("reset password fields use new-password autocomplete", () => {
  const source = readSource("src/components/auth/reset-password-form.tsx");
  assert.match(source, /name="password"/);
  assert.match(source, /name="confirmPassword"[\s\S]*autoComplete="new-password"/);
});

test("portal login fields use appropriate autocomplete values", () => {
  const source = readSource("src/components/client-portal/portal-login-form.tsx");
  assert.match(source, /name="email"[\s\S]*autoComplete="email"/);
  assert.match(source, /name="password"[\s\S]*autoComplete="current-password"/);
});

test("portal user creation fields use appropriate autocomplete values", () => {
  const source = readSource("src/components/client-portal/create-portal-user-form.tsx");
  assert.match(source, /name="email"[\s\S]*autoComplete="email"/);
  assert.match(source, /name="password"[\s\S]*autoComplete="new-password"/);
});

test("global search uses off autocomplete", () => {
  const source = readSource("src/components/layout/global-search.tsx");
  assert.match(source, /type="search"[\s\S]*autoComplete="off"/);
});

test("shared Input forwards autoComplete via props spread", () => {
  const source = readSource("src/components/ui/input.tsx");
  assert.match(source, /\{\.\.\.props\}/);
  assert.doesNotMatch(source, /autoComplete=/);
});

test("Stripe hosted fields were not modified in this phase", () => {
  const billing = readSource("src/components/settings/billing-settings-panel.tsx");
  assert.doesNotMatch(billing, /Elements|CardElement|PaymentElement/);
});

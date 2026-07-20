import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 10 accessibility doc and rule exist", () => {
  assert.ok(existsSync(join(rootDir, "docs/12_BUILD_BIBLE_V2_CHAPTER_10_ACCESSIBILITY.md")));
  const doc = readSource("docs/12_BUILD_BIBLE_V2_CHAPTER_10_ACCESSIBILITY.md");
  assert.match(doc, /Status:\*\* Implemented/);
  assert.match(doc, /WCAG 2\.2 AA/);
  const rule = readSource(".cursor/rules/build-bible-v2-ch10-accessibility.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /focusRing/);
  assert.match(rule, /trapFocus/);
});

test("shared focus helpers exist", () => {
  const focus = readSource("src/lib/a11y/focus.ts");
  assert.match(focus, /export function getFocusableElements/);
  assert.match(focus, /export function trapFocus/);
  assert.match(focus, /export function focusFirstElement/);
  assert.match(focus, /export function restoreFocus/);
});

test("Dialog and ConfirmDialog expose modal semantics", () => {
  const dialog = readSource("src/components/ui/dialog.tsx");
  const confirm = readSource("src/components/ui/confirm-dialog.tsx");
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /useId/);
  assert.match(confirm, /aria-modal="true"/);
  assert.match(confirm, /focusFirstElement/);
});

test("table header cells default to scope col", () => {
  const table = readSource("src/components/ui/table.tsx");
  assert.match(table, /scope = "col"/);
  assert.match(table, /export function AuroraTableCaption/);
});

test("major shells expose SkipLink and main-content", () => {
  const marketing = readSource("src/components/marketing/marketing-shell.tsx");
  const login = readSource("src/components/branding/login-branding-shell.tsx");
  const dashboardShell = readSource("src/components/layout/dashboard-shell.tsx");
  const dashboardMain = readSource("src/components/layout/dashboard-sidebar.tsx");
  const portal = readSource("src/components/client-portal/portal-shell.tsx");
  assert.match(dashboardShell, /SkipLink/);
  assert.match(dashboardMain, /main-content/);
  for (const source of [marketing, login, portal]) {
    assert.match(source, /SkipLink/);
    assert.match(source, /main-content/);
  }
});

test("newsletter form has an accessible email label", () => {
  const form = readSource("src/components/marketing/newsletter-signup-form.tsx");
  assert.match(form, /htmlFor=\{emailId\}/);
  assert.match(form, /Work email/);
  assert.match(form, /autoComplete="email"/);
});

test("cookie overlays trap and restore focus", () => {
  const banner = readSource("src/components/consent/cookie-consent-banner.tsx");
  const modal = readSource("src/components/consent/cookie-preferences-modal.tsx");
  assert.match(banner, /trapFocus/);
  assert.match(banner, /restoreFocus/);
  assert.match(modal, /trapFocus/);
  assert.match(modal, /restoreFocus/);
});

test("global search and AI panels manage focus", () => {
  const search = readSource("src/components/layout/global-search.tsx");
  const report = readSource("src/components/reports/ai/report-assistant-panel.tsx");
  const operational = readSource("src/components/operational/ai/operational-assistant-panel.tsx");
  assert.match(search, /trapFocus/);
  assert.match(search, /restoreFocus/);
  assert.match(report, /trapFocus/);
  assert.match(report, /restoreFocus/);
  assert.match(operational, /trapFocus/);
  assert.match(operational, /restoreFocus/);
});

test("filter tabs and secondary nav keep keyboard focus styles", () => {
  const tokens = readSource("src/lib/ui/tokens.ts");
  const secondary = readSource("src/components/layout/secondary-nav-bar.tsx");
  assert.match(tokens, /filterTabActive[\s\S]*focusRing/);
  assert.match(tokens, /filterTabInactive[\s\S]*focusRing/);
  assert.doesNotMatch(secondary, /role="tablist"/);
  assert.match(secondary, /aria-current/);
});

test("focusRing token remains the shared visible focus indicator", () => {
  const tokens = readSource("src/lib/ui/tokens.ts");
  assert.match(tokens, /export const focusRing/);
  assert.match(tokens, /focus-visible:ring-2/);
});

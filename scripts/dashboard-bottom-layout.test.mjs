/**
 * Regression: authenticated shell must not paint a large bottom surface panel
 * that consumes the viewport (marketing megabar / fixed bottom chrome).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("dashboard shell keeps SiteFooter inside the scrolling main region", () => {
  const shell = readSource("src/components/layout/dashboard-shell.tsx");
  const main = readSource("src/components/layout/dashboard-sidebar.tsx");

  assert.match(main, /id="main-content"/);
  assert.match(main, /overflow-y-auto/);
  assert.match(shell, /<DashboardMain>/);
  assert.match(shell, /SiteFooter variant="minimal"/);

  const mainBlock = shell.match(/<DashboardMain>[\s\S]*?<\/DashboardMain>/)?.[0] ?? "";
  assert.match(mainBlock, /SiteFooter variant="minimal"/);
  assert.doesNotMatch(shell, /fixed inset-x-0 bottom-0/);
});

test("authenticated minimal footer is compact without surface megabar", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const minimal = footer.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";

  assert.ok(minimal.length > 0);
  assert.doesNotMatch(minimal, /bg-surface\/40/);
  assert.doesNotMatch(minimal, /bg-secondary/);
  assert.doesNotMatch(minimal, /grid gap-8/);
  assert.doesNotMatch(minimal, /FooterLinkColumn title="Product"/);
  assert.match(minimal, /FOOTER_LINKS\.map/);
  assert.match(minimal, /FOOTER_BRAND_DESCRIPTION/);
});

test("marketing footer retains full-column IA separately from app shell", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  assert.match(
    footer,
    /if \(variant === "marketing"\) \{[\s\S]*FooterLinkColumn dark title="Product"[\s\S]*FooterLinkColumn dark title="Legal"[\s\S]*FooterLinkColumn dark title="Company"/,
  );
});

test("only cookie consent uses fixed full-width bottom chrome (not shell footer)", () => {
  const banner = readSource("src/components/consent/cookie-consent-banner.tsx");
  const shell = readSource("src/components/layout/dashboard-shell.tsx");
  const footer = readSource("src/components/layout/site-footer.tsx");

  assert.match(banner, /fixed inset-x-0 bottom-0/);
  assert.doesNotMatch(shell, /fixed inset-x-0 bottom-0/);
  assert.doesNotMatch(footer, /fixed inset-x-0 bottom-0/);
});

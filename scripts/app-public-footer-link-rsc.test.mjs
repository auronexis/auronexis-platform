/**
 * Regression: authenticated app shell must not next/link-prefetch public marketing routes.
 * Public/legal destinations resolve to canonical www origin via plain anchors.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

function minimalFooterBlock(source) {
  return source.match(/if \(variant === "minimal"\) \{[\s\S]*?(?=if \(variant === "marketing"\))/)?.[0] ?? "";
}

function marketingFooterBlock(source) {
  return (
    source.match(
      /if \(variant === "marketing"\) \{[\s\S]*CookiePreferencesButton[\s\S]*?(?=\n  return \()/,
    )?.[0] ?? ""
  );
}

test("1 minimal authenticated footer avoids next/link for FOOTER_LINKS", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const minimal = minimalFooterBlock(footer);

  assert.ok(minimal.length > 0);
  assert.match(minimal, /FOOTER_LINKS\.map/);
  assert.match(minimal, /getCanonicalUrl\(link\.href\)\.toString\(\)/);
  assert.match(minimal, /<a[\s\S]*href=\{getCanonicalUrl\(link\.href\)\.toString\(\)\}/);
  assert.doesNotMatch(minimal, /<Link[\s\S]*href=\{link\.href\}/);
  assert.doesNotMatch(minimal, /prefetch=\{false\}/);
});

test("2 canonical public destinations resolve to www.auroranexis.com", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const seo = readSource("src/lib/company/company-seo.ts");
  const links = readSource("src/lib/company/company-links.ts");
  const minimal = minimalFooterBlock(footer);

  assert.match(seo, /PUBLIC_CANONICAL_ORIGIN = `https:\/\/\$\{PRODUCTION_DOMAINS\.www\}`/);
  assert.match(seo, /export function getCanonicalUrl\(path: string\): URL/);
  assert.match(minimal, /getCanonicalUrl/);
  assert.match(links, /label: "Privacy", href: LEGAL_ROUTES\.privacy/);
  assert.match(links, /label: "About", href: MARKETING_ROUTES\.about/);
  assert.match(seo, /return new URL\(normalizedPath, resolveCanonicalBaseUrl\(\)\)/);
});

test("3 internal dashboard navigation remains unchanged", () => {
  const shell = readSource("src/components/layout/dashboard-shell.tsx");
  const sidebarNav = readSource("src/components/layout/sidebar-nav.tsx");

  assert.match(shell, /SiteFooter variant="minimal"/);
  assert.match(sidebarNav, /from "next\/link"/);
  assert.match(sidebarNav, /<Link/);
  assert.doesNotMatch(shell, /getCanonicalUrl/);
  assert.doesNotMatch(sidebarNav, /getCanonicalUrl/);
});

test("4 CSP and middleware source contracts remain untouched by footer remediation", () => {
  const middleware = readSource("src/middleware.ts");
  const routing = readSource("src/lib/deployment/middleware-routing.ts");
  const csp = readSource("src/lib/security/csp.ts");
  const footer = readSource("src/components/layout/site-footer.tsx");

  assert.match(middleware, /shouldAttachNoIndexHeader/);
  assert.match(routing, /shouldRedirectAppMarketingToWww/);
  assert.match(csp, /buildContentSecurityPolicy/);
  assert.doesNotMatch(footer, /middleware/);
  assert.doesNotMatch(footer, /buildContentSecurityPolicy/);
});

test("5 footer labels and FOOTER_LINKS content remain unchanged", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const links = readSource("src/lib/company/company-links.ts");
  const minimal = minimalFooterBlock(footer);
  const marketing = marketingFooterBlock(footer);

  assert.match(links, /label: "Privacy"/);
  assert.match(links, /label: "Terms"/);
  assert.match(links, /label: "About"/);
  assert.match(links, /label: "Support"/);
  assert.match(minimal, /\{link\.label\}/);
  assert.match(marketing, /FooterLinkColumn dark title="Legal" links=\{FOOTER_SECTIONS\.legal\}/);
  assert.match(footer, /function FooterLinkColumn[\s\S]*<Link[\s\S]*href=\{link\.href\}/);
});

test("6 marketing footer keeps relative next/link prefetch on www host", () => {
  const footer = readSource("src/components/layout/site-footer.tsx");
  const marketing = marketingFooterBlock(footer);
  const linkColumn = footer.match(/function FooterLinkColumn[\s\S]*?(?=export function SiteFooter)/)?.[0] ?? "";

  assert.ok(marketing.length > 0);
  assert.match(marketing, /FooterLinkColumn/);
  assert.match(linkColumn, /<Link[\s\S]*href=\{link\.href\}/);
  assert.doesNotMatch(marketing, /getCanonicalUrl/);
  assert.doesNotMatch(linkColumn, /getCanonicalUrl/);
});

test("7 authenticated cookie consent legal links use www anchors not next/link", () => {
  const banner = readSource("src/components/consent/cookie-consent-banner.tsx");

  assert.match(banner, /function ConsentLegalLink/);
  assert.match(banner, /authenticatedSurface[\s\S]*getCanonicalUrl\(href\)\.toString\(\)/);
  assert.match(banner, /href=\{LEGAL_ROUTES\.cookies\}/);
  assert.match(banner, /href=\{LEGAL_ROUTES\.privacy\}/);
  assert.match(banner, /Cookie Policy/);
  assert.match(banner, /Privacy Policy/);
});

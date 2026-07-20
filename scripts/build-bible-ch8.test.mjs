import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

function listPageFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      listPageFiles(full, acc);
      continue;
    }
    if (entry.name === "page.tsx") {
      acc.push(full);
    }
  }
  return acc;
}

test("Build Bible V2 Chapter 8 SEO doc and rule exist", () => {
  assert.ok(existsSync(join(rootDir, "docs/10_BUILD_BIBLE_V2_CHAPTER_08_SEO.md")));
  const doc = readSource("docs/10_BUILD_BIBLE_V2_CHAPTER_08_SEO.md");
  assert.match(doc, /Status:\*\* Implemented/);
  const rule = readSource(".cursor/rules/build-bible-v2-ch8-seo.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /isIndexablePublicRoute/);
});

test("route catalog classifies public vs private surfaces", () => {
  const catalog = readSource("src/lib/seo/route-catalog.ts");
  assert.match(catalog, /export function classifyRoute/);
  assert.match(catalog, /export function isIndexablePublicRoute/);
  assert.match(catalog, /public_website/);
  assert.match(catalog, /dashboard/);
  assert.match(catalog, /portal/);
  assert.match(catalog, /authentication/);
  assert.match(catalog, /api/);
});

test("robots disallow private prefixes and auth noindex routes", () => {
  const robots = readSource("src/lib/seo/robots.ts");
  const privateRoutes = readSource("src/lib/seo/private-routes.ts");
  assert.match(robots, /NOINDEX_ROUTES/);
  assert.match(robots, /PRIVATE_ROUTE_PREFIXES/);
  assert.match(robots, /host:/);
  assert.match(privateRoutes, /\/auth/);
  assert.match(privateRoutes, /\/legal/);
});

test("sitemap validation rejects private and noindex routes", () => {
  const sitemap = readSource("src/lib/seo/sitemap.ts");
  assert.match(sitemap, /isIndexablePublicRoute/);
  assert.match(sitemap, /noindex route in sitemap/);
  assert.match(sitemap, /uniquePublicRoutes/);
});

test("private layouts and legacy legal redirects are noindex", () => {
  const dashboard = readSource("src/app/(dashboard)/layout.tsx");
  const portal = readSource("src/app/client-portal/(portal)/layout.tsx");
  const auth = readSource("src/app/(auth)/layout.tsx");
  const automation = readSource("src/app/(dashboard)/automation/layout.tsx");
  const legacyPrivacy = readSource("src/app/legal/privacy/page.tsx");
  assert.match(dashboard, /createPrivateAppMetadata/);
  assert.match(portal, /createPrivateAppMetadata/);
  assert.match(auth, /createPrivateAppMetadata/);
  assert.match(automation, /createPrivateAppMetadata/);
  assert.match(legacyPrivacy, /permanentRedirect/);
  assert.match(legacyPrivacy, /createPrivateAppMetadata/);
});

test("middleware attaches X-Robots-Tag for private paths", () => {
  const middleware = readSource("src/middleware.ts");
  const routing = readSource("src/lib/deployment/middleware-routing.ts");
  assert.match(middleware, /shouldAttachNoIndexHeader/);
  assert.match(routing, /shouldAttachNoIndexHeader/);
  assert.match(routing, /isPrivateRoute\(pathname\)/);
});

test("public marketing pages use PAGE_SEO registry metadata", () => {
  const marketingRoot = join(rootDir, "src/app/(marketing)");
  const pages = listPageFiles(marketingRoot).filter((file) => !file.includes(`${join("industries", "[slug]")}`) || true);
  let checked = 0;
  for (const file of pages) {
    if (file.includes("[slug]")) {
      const source = readFileSync(file, "utf8");
      assert.match(source, /createPageMetadataForPath/);
      checked += 1;
      continue;
    }
    const source = readFileSync(file, "utf8");
    assert.match(source, /createPageMetadataForPath/, file);
    checked += 1;
  }
  assert.ok(checked >= 20, `expected many marketing pages, got ${checked}`);
});

test("PAGE_SEO titles and descriptions are unique", () => {
  const routes = readSource("src/lib/seo/routes.ts");
  const titles = [...routes.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]);
  const descriptions = [...routes.matchAll(/description:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(titles).size, titles.length, "duplicate PAGE_SEO titles");
  assert.equal(new Set(descriptions).size, descriptions.length, "duplicate PAGE_SEO descriptions");
  assert.doesNotMatch(routes, /Lorem Ipsum|TODO:|placeholder description/i);
});

test("llms.txt does not advertise private API routes", () => {
  const llms = readSource("src/lib/seo/llms-txt.ts");
  assert.match(llms, /\/docs\/api/);
  assert.doesNotMatch(llms, /\/api\/docs/);
  assert.doesNotMatch(llms, /\/dashboard/);
  assert.doesNotMatch(llms, /\/client-portal/);
});

test("core web vitals font loading uses display swap", () => {
  const layout = readSource("src/app/layout.tsx");
  assert.match(layout, /display:\s*"swap"/);
  const config = readSource("next.config.ts");
  assert.match(config, /poweredByHeader:\s*false/);
});

test("open graph assets and metadata remain absolute", () => {
  const metadata = readSource("src/lib/seo/metadata.ts");
  const assets = readSource("src/lib/branding/assets.ts");
  assert.match(metadata, /resolveOpenGraphImageUrl/);
  assert.match(metadata, /canonical: url\.toString\(\)/);
  assert.match(assets, /opengraph-1200x630\.png/);
});

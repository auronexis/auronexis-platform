import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

test("Build Bible V2 Chapter 3 Next.js/TS doc and rule exist", () => {
  assert.ok(existsSync(join(rootDir, "docs/05_BUILD_BIBLE_V2_CHAPTER_03_NEXT_TYPESCRIPT.md")));
  const rule = readSource(".cursor/rules/build-bible-v2-ch3-next-typescript.mdc");
  assert.match(rule, /alwaysApply:\s*true/);
  assert.match(rule, /Prefer Server Components/);
});

test("App Router error files share AppRouterErrorProps", () => {
  const boundary = readSource("src/components/errors/route-error-boundary.tsx");
  assert.match(boundary, /export type AppRouterErrorProps/);
  for (const relative of [
    "src/app/error.tsx",
    "src/app/(dashboard)/error.tsx",
    "src/app/(marketing)/error.tsx",
    "src/app/client-portal/error.tsx",
    "src/app/(dashboard)/settings/error.tsx",
    "src/app/global-error.tsx",
  ]) {
    const source = readSource(relative);
    assert.match(source, /AppRouterErrorProps/);
    assert.match(source, /RouteErrorBoundary/);
  }
});

test("marketing loading uses RouteLoadingShell", () => {
  const loading = readSource("src/app/(marketing)/loading.tsx");
  assert.match(loading, /RouteLoadingShell/);
});

test("presentational AI empty state is a Server Component", () => {
  const source = readSource("src/components/ai/ai-empty-state.tsx");
  assert.doesNotMatch(source, /^["']use client["']/m);
});

test("profile interactive controls are isolated from section card", () => {
  const card = readSource("src/components/profile/profile-section-card.tsx");
  const controls = readSource("src/components/profile/profile-section-controls.tsx");
  assert.doesNotMatch(card, /^["']use client["']/m);
  assert.match(controls, /^["']use client["']/m);
  assert.match(controls, /ProfileSaveFooter/);
  assert.match(controls, /ProfileSelect/);
  assert.doesNotMatch(card, /ProfileSaveFooter/);
});

test("SLA activity mapping avoids as-never on timeline", () => {
  const page = readSource("src/app/(dashboard)/settings/sla/[id]/page.tsx");
  assert.match(page, /listSlaActivityForPolicy/);
  assert.doesNotMatch(page, /as never/);
});

test("health breakdown parsing uses Json not as-never", () => {
  const queries = readSource("src/lib/health/queries.ts");
  const types = readSource("src/lib/health/types.ts");
  // Snapshot rows are mapped via mapHealthSnapshotRow; breakdown parsing stays typed as Json.
  assert.match(queries, /mapHealthSnapshotRow/);
  assert.match(types, /parseHealthBreakdown\(.*as Json/);
  assert.doesNotMatch(queries, /as never/);
  assert.doesNotMatch(types, /as never/);
});
test("deprecated ReportAIUsageCard shim is removed", () => {
  assert.equal(existsSync(join(rootDir, "src/components/reports/ai/report-ai-usage-card.tsx")), false);
  const billingLoading = readSource("src/app/(dashboard)/settings/billing/loading.tsx");
  assert.match(billingLoading, /RouteLoadingShell/);
  assert.ok(existsSync(join(rootDir, "src/app/(dashboard)/not-found.tsx")));
  assert.ok(existsSync(join(rootDir, "src/app/client-portal/(portal)/not-found.tsx")));
});

/**
 * Enterprise regression matrix — source-contract validation of critical workflows.
 * Does not change product behaviour; asserts wiring and isolation patterns only.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  assertFileExists,
  listApiV1RouteFiles,
  pathExists,
  readSource,
  ENTERPRISE_REGRESSION_SUITE,
} from "./_test-helpers/read-source.mjs";

test("enterprise regression suite catalog is complete and ordered", () => {
  assert.ok(ENTERPRISE_REGRESSION_SUITE.length >= 20);
  assert.equal(ENTERPRISE_REGRESSION_SUITE[0], "scripts/build-bible-ch1.test.mjs");
  assert.ok(ENTERPRISE_REGRESSION_SUITE.includes("scripts/build-bible-ch13.test.mjs"));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.includes("scripts/paddle-billing.test.mjs"));
  assert.ok(ENTERPRISE_REGRESSION_SUITE.includes("scripts/technical-seo.test.mjs"));
  for (const relativePath of ENTERPRISE_REGRESSION_SUITE) {
    assertFileExists(relativePath);
  }
});

test("authentication surfaces remain wired", () => {
  for (const path of [
    "src/app/(auth)/login/page.tsx",
    "src/app/(auth)/signup/page.tsx",
    "src/app/(auth)/forgot-password/page.tsx",
    "src/app/(auth)/reset-password/page.tsx",
    "src/components/auth/login-form.tsx",
    "src/components/auth/signup-form.tsx",
  ]) {
    assertFileExists(path);
  }
  const login = readSource("src/components/auth/login-form.tsx");
  assert.match(login, /markPendingAnalyticsEvent\("login_completed"/);
  const signup = readSource("src/components/auth/signup-form.tsx");
  assert.match(signup, /signup_completed/);
  assert.match(signup, /workspace_created/);
});

test("RBAC roles and module matrix remain defined", () => {
  const permissions = readSource("src/lib/rbac/permissions.ts");
  for (const role of ["owner", "admin", "staff", "viewer"]) {
    assert.match(permissions, new RegExp(`"${role}"`));
  }
  for (const moduleName of [
    "dashboard",
    "clients",
    "reports",
    "risks",
    "incidents",
    "settings",
    "sales",
    "customer_success",
    "executive_intelligence",
  ]) {
    assert.match(permissions, new RegExp(`"${moduleName}"`));
  }
  assert.match(permissions, /canAccessModule/);
  assert.match(permissions, /canAccessSettings/);
  assert.match(permissions, /MODULE_PERMISSIONS/);
});

test("authorization guards remain the permission entry point", () => {
  const guards = readSource("src/lib/authorization/guards.ts");
  const authz = readSource("src/lib/authorization/permissions.ts");
  assert.match(guards, /hasPermission/);
  assert.match(guards, /ACTION_DENIED_MESSAGE/);
  assert.match(guards, /requireSessionPermission/);
  assert.match(authz, /Permission/);
});

test("client lifecycle actions remain server-backed", () => {
  assertFileExists("src/components/clients/client-form.tsx");
  assertFileExists("src/lib/clients/actions.ts");
  const form = readSource("src/components/clients/client-form.tsx");
  assert.match(form, /markPendingAnalyticsEvent\("client_created"/);
});

test("reports risks and incidents forms remain instrumented", () => {
  const report = readSource("src/components/reports/report-form.tsx");
  const risk = readSource("src/components/risks/risk-form.tsx");
  const incident = readSource("src/components/incidents/incident-form.tsx");
  assert.match(report, /report_generated/);
  assert.match(risk, /risk_created/);
  assert.match(incident, /incident_created/);
});

test("API v1 routes use withApiHandler and scoped handlers", () => {
  const routes = listApiV1RouteFiles();
  assert.ok(routes.length >= 10, `expected API v1 routes, found ${routes.length}`);
  for (const routePath of routes) {
    const source = readSource(routePath);
    assert.match(source, /withApiHandler/, `${routePath} must use withApiHandler`);
    // `/me` is session-authenticated without explicit scope list; all other routes declare scopes.
    if (!routePath.endsWith("/me/route.ts")) {
      assert.match(source, /scopes:\s*\[/, `${routePath} must declare scopes`);
    }
  }
  const clients = readSource("src/app/api/v1/clients/route.ts");
  assert.match(clients, /respondWithPaginatedList/);
  assert.match(clients, /clients\.read/);
  assert.match(clients, /clients\.write/);
  const me = readSource("src/app/api/v1/me/route.ts");
  assert.match(me, /apiGetMe|withApiHandler/);
});

test("Paddle webhook and entitlements remain fail-closed", () => {
  const route = readSource("src/app/api/paddle/webhook/route.ts");
  const provider = readSource("src/lib/billing/provider.ts");
  const entitlements = readSource("src/lib/entitlements/resolver.ts");
  assert.match(route, /unmarshal/);
  assert.match(route, /ensurePaddleIdempotency/);
  assert.match(provider, /return "paddle"/);
  assert.match(entitlements, /resolveOrganizationEntitlements/);
  assert.ok(!pathExists("src/lib/stripe"));
});

test("client portal isolation surfaces remain present", () => {
  for (const path of [
    "src/app/client-portal/login/page.tsx",
    "src/components/client-portal/portal-shell.tsx",
    "src/components/client-portal/portal-login-form.tsx",
    "src/lib/client-portal/session.ts",
    "src/lib/client-portal/guards.ts",
    "src/app/client-portal/(portal)/reports/page.tsx",
    "src/app/client-portal/(portal)/risks/page.tsx",
    "src/app/client-portal/(portal)/incidents/page.tsx",
    "src/app/client-portal/(portal)/health/page.tsx",
    "src/app/client-portal/(portal)/legal/page.tsx",
  ]) {
    assertFileExists(path);
  }
  const shell = readSource("src/components/client-portal/portal-shell.tsx");
  assert.match(shell, /SkipLink/);
  assert.match(shell, /main-content/);
  const login = readSource("src/components/client-portal/portal-login-form.tsx");
  assert.match(login, /portal_login/);
});

test("automation and AI platforms remain private and gated", () => {
  assertFileExists("src/app/api/v1/automation/route.ts");
  assertFileExists("src/app/api/v1/ai/route.ts");
  const automation = readSource("src/app/api/v1/automation/route.ts");
  assert.match(automation, /withApiHandler/);
  const ai = readSource("src/app/api/v1/ai/route.ts");
  assert.match(ai, /withApiHandler/);
});

test("SEO accessibility and i18n chapter contracts remain available", () => {
  assertFileExists("scripts/build-bible-ch8.test.mjs");
  assertFileExists("scripts/build-bible-ch9.test.mjs");
  assertFileExists("scripts/build-bible-ch10.test.mjs");
  assertFileExists("scripts/technical-seo.test.mjs");
  assertFileExists("scripts/workspace-currency.test.mjs");
  const marketing = readSource("src/components/marketing/marketing-shell.tsx");
  assert.match(marketing, /SkipLink/);
  assert.match(marketing, /main-content/);
});

test("settings billing and regional settings remain reachable", () => {
  assertFileExists("src/app/(dashboard)/settings/billing/page.tsx");
  assertFileExists("src/app/(dashboard)/settings/organization/page.tsx");
  assertFileExists("src/app/(dashboard)/settings/plans/page.tsx");
  const orgForm = readSource("src/components/settings/organization-form.tsx");
  assert.match(orgForm, /timezone|dateFormat|currency/i);
});

test("error recovery boundaries remain for dashboard auth and portal", () => {
  assert.ok(
    pathExists("src/app/(dashboard)/error.tsx") ||
      pathExists("src/app/error.tsx") ||
      pathExists("src/app/global-error.tsx"),
  );
  assertFileExists("src/app/client-portal/error.tsx");
  assertFileExists("src/app/not-found.tsx");
});

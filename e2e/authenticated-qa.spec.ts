import { expect, test } from "@playwright/test";
import { hasE2ECredentials } from "./helpers/auth";
import {
  attachConsoleErrorCollector,
  auditAuthenticatedPage,
  auditAuthenticatedPublicPage,
  assertAppShellLoaded,
} from "./helpers/qa";

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/docs",
  "/docs/clients",
  "/api/docs",
  "/about",
  "/contact",
  "/imprint",
  "/privacy",
  "/terms",
] as const;

const APP_ROUTES = [
  "/dashboard",
  "/clients",
  "/reports",
  "/reports/new",
  "/risks",
  "/incidents",
  "/monitoring",
  "/settings/billing",
  "/settings/api",
  "/settings/diagnostics",
  "/profile",
] as const;

test.describe.configure({ mode: "serial" });

test.describe("Authenticated full app QA", () => {
  test.skip(
    !hasE2ECredentials(),
    "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD (or E2E_EMAIL / E2E_PASSWORD) in .env.local.",
  );

  test("1. Login and verify dashboard loads", async ({ page }) => {
    const consoleErrors = attachConsoleErrorCollector(page);
    await page.goto("/dashboard");
    await assertAppShellLoaded(page);
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });

  test.describe("2. Public pages — auth-aware navigation", () => {
    for (const route of PUBLIC_ROUTES) {
      test(route, async ({ page }) => {
        const consoleErrors = attachConsoleErrorCollector(page);
        await auditAuthenticatedPublicPage(page, route, consoleErrors);
      });
    }
  });

  test.describe("3. Main app routes — layout and health", () => {
    for (const route of APP_ROUTES) {
      test(route, async ({ page }) => {
        const consoleErrors = attachConsoleErrorCollector(page);
        await auditAuthenticatedPage(page, route, consoleErrors, { appPage: true });
      });
    }
  });
});

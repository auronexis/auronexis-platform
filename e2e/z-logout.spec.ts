import { test, expect } from "@playwright/test";
import { hasE2ECredentials, logoutFromDashboard } from "./helpers/auth";

/** Runs after staging.spec.ts — sign-out must not run before other authenticated suites. */
test.describe.configure({ mode: "serial" });

test.beforeEach(() => {
  test.skip(!hasE2ECredentials(), "Set E2E_EMAIL and E2E_PASSWORD for authenticated flows.");
});

test("logout", async ({ page }) => {
  await page.goto("/dashboard");
  await logoutFromDashboard(page);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

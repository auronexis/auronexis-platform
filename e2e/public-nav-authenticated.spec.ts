import { expect, test } from "@playwright/test";
import { hasE2ECredentials } from "./helpers/auth";

const AUTHENTICATED_PUBLIC_ROUTES = ["/api/docs", "/docs/clients", "/pricing", "/contact"] as const;

test.describe("public navigation — authenticated", () => {
  test.skip(!hasE2ECredentials(), "Set E2E_EMAIL and E2E_PASSWORD for authenticated public nav tests.");

  for (const route of AUTHENTICATED_PUBLIC_ROUTES) {
    test(`${route} shows Dashboard and hides anonymous CTAs`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Start free trial" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Book demo" })).toHaveCount(0);
    });
  }
});

import { expect, test } from "@playwright/test";

const ANONYMOUS_PUBLIC_ROUTES = ["/api/docs", "/docs/clients", "/pricing"] as const;

test.describe("public navigation — anonymous", () => {
  for (const route of ANONYMOUS_PUBLIC_ROUTES) {
    test(`${route} shows Sign in and Start free trial`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: "Start free trial" }).first()).toBeVisible();
    });
  }
});

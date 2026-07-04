import { expect, test } from "@playwright/test";

const ANONYMOUS_PUBLIC_ROUTES = [
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

test.describe("public navigation — anonymous", () => {
  for (const route of ANONYMOUS_PUBLIC_ROUTES) {
    test(`${route} shows Sign in and Start free trial`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator('a[href="/login"]').first()).toBeVisible();
      await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
    });
  }
});

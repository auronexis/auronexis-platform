import { expect, test } from "@playwright/test";
import { hasE2ECredentials } from "./helpers/auth";
import { assertNoAnonymousCtas } from "./helpers/qa";

const AUTHENTICATED_PUBLIC_ROUTES = [
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

test.describe("public navigation — authenticated", () => {
  test.skip(
    !hasE2ECredentials(),
    "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD for authenticated public nav tests.",
  );

  test("/", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await assertNoAnonymousCtas(page);
  });

  for (const route of AUTHENTICATED_PUBLIC_ROUTES) {
    test(`${route} shows Dashboard and hides anonymous CTAs`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
      await assertNoAnonymousCtas(page);
    });
  }
});

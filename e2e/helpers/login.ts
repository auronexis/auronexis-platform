import { expect, type Page } from "@playwright/test";
import { attachConsoleErrorCollector } from "./qa";

export async function assertLoginFormVisible(page: Page): Promise<void> {
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
}

export async function assertLoginBrandingVisible(page: Page): Promise<void> {
  await assertLoginFormVisible(page);

  const brandImage = page.getByRole("img", { name: /Auroranexis/i });
  const brandText = page.getByText("Auroranexis", { exact: true });

  if ((await brandImage.count()) > 0) {
    await expect(brandImage.first()).toBeVisible();
  } else {
    await expect(brandText.first()).toBeVisible();
  }

  await expect(page.locator("form").filter({ has: page.getByLabel("Email") })).toBeVisible();
}

export async function assertLoginPageHealthy(page: Page): Promise<void> {
  const consoleErrors = attachConsoleErrorCollector(page);
  await page.goto("/login");
  await assertLoginFormVisible(page);

  const textLength = await page.locator("body").innerText().then((text) => text.trim().length);
  expect(textLength).toBeGreaterThan(40);
  expect(consoleErrors).toEqual([]);
}

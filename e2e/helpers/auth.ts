import { expect, type Page } from "@playwright/test";

export const e2eCredentials = {
  email: process.env.E2E_EMAIL ?? "",
  password: process.env.E2E_PASSWORD ?? "",
};

export function hasE2ECredentials(): boolean {
  return Boolean(e2eCredentials.email && e2eCredentials.password);
}

/** Sign in via the login form and wait for dashboard. */
export async function loginAsTestUser(page: Page): Promise<void> {
  if (!hasE2ECredentials()) {
    throw new Error("Set E2E_EMAIL and E2E_PASSWORD to run authenticated flows.");
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(e2eCredentials.email);
  await page.getByLabel("Password").fill(e2eCredentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 30_000 });
  await expect(page.locator("#main-content")).toBeVisible({ timeout: 15_000 });
}

export async function logoutFromDashboard(page: Page): Promise<void> {
  await page.goto("/dashboard");
  await expect(page.locator("#main-content")).toBeVisible({ timeout: 15_000 });
  const accountMenu = page.getByRole("button", { name: /Open account menu/i });
  await expect(accountMenu).toBeVisible({ timeout: 15_000 });
  await accountMenu.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible({ timeout: 10_000 });
  await menu.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL("**/login**", { timeout: 15_000 });
}

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}`;
}

/** Select the first non-empty option in a labelled select (e.g. Client). */
export async function selectFirstOption(page: Page, label: string): Promise<void> {
  const select = page.getByLabel(label);
  const options = select.locator("option");
  const count = await options.count();
  for (let i = 0; i < count; i += 1) {
    const value = await options.nth(i).getAttribute("value");
    if (value) {
      await select.selectOption(value);
      return;
    }
  }
  throw new Error(`No selectable options found for "${label}". Create a client first.`);
}

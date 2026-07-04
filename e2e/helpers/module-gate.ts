import { expect, type Page } from "@playwright/test";
import { assertAppShellLoaded } from "./qa";

export async function gotoAppRoute(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await assertAppShellLoaded(page);
}

export async function isUpgradeGateVisible(page: Page): Promise<boolean> {
  return page.getByRole("heading", { name: "Upgrade required", level: 1 }).isVisible();
}

export async function assertUpgradeGate(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "Upgrade required", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "View plans" })).toBeVisible();
}

/** Returns whether the module UI or a plan upgrade gate is shown — both are valid outcomes. */
export async function expectModuleOrUpgradeGate(
  page: Page,
  options: { moduleHeading: string | RegExp; level?: 1 | 2 },
): Promise<"module" | "gated"> {
  if (await isUpgradeGateVisible(page)) {
    await assertUpgradeGate(page);
    return "gated";
  }

  await expect(
    page.getByRole("heading", { level: options.level ?? 1, name: options.moduleHeading }),
  ).toBeVisible();
  return "module";
}

/** Navigate to a create route and run the flow only when the module is not plan-gated. */
export async function createRecordOrExpectUpgradeGate(
  page: Page,
  options: {
    route: string;
    runCreate: () => Promise<void>;
    successUrl: RegExp;
    successHeading: string | RegExp;
  },
): Promise<void> {
  await gotoAppRoute(page, options.route);

  if (await isUpgradeGateVisible(page)) {
    await assertUpgradeGate(page);
    return;
  }

  await options.runCreate();
  await page.waitForURL(options.successUrl, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: options.successHeading })).toBeVisible();
}

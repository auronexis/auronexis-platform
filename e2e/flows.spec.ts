import { test, expect } from "@playwright/test";
import {
  e2eCredentials,
  hasE2ECredentials,
  selectFirstOption,
  uniqueSuffix,
} from "./helpers/auth";

test.describe.configure({ mode: "serial" });

test.beforeEach(() => {
  test.skip(!hasE2ECredentials(), "Set E2E_EMAIL and E2E_PASSWORD for authenticated flows.");
});

test("login session reaches dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("main")).toBeVisible();
});

test("create client", async ({ page }) => {
  const name = `E2E Client ${uniqueSuffix()}`;
  await page.goto("/clients/new");
  await page.getByLabel("Client name").fill(name);
  await page.getByRole("button", { name: /create client/i }).click();
  await page.waitForURL(/\/clients\/[a-f0-9-]+/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
});

test("create risk", async ({ page }) => {
  const title = `E2E Risk ${uniqueSuffix()}`;
  await page.goto("/risks/new");
  await page.getByLabel("Risk title").fill(title);
  await selectFirstOption(page, "Client");
  await page.getByRole("button", { name: /create risk/i }).click();
  await page.waitForURL(/\/risks\/[a-f0-9-]+/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
});

test("create incident", async ({ page }) => {
  const title = `E2E Incident ${uniqueSuffix()}`;
  await page.goto("/incidents/new");
  await page.getByLabel("Incident title").fill(title);
  await selectFirstOption(page, "Client");
  await page.getByRole("button", { name: /create incident/i }).click();
  await page.waitForURL(/\/incidents\/[a-f0-9-]+/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
});

test("create report", async ({ page }) => {
  const title = `E2E Report ${uniqueSuffix()}`;
  await page.goto("/reports/new");
  await page.getByLabel("Report title").fill(title);
  await selectFirstOption(page, "Client");
  await page.getByLabel("Reporting period start").fill("2025-01-01");
  await page.getByLabel("Reporting period end").fill("2025-01-31");
  await page.getByRole("button", { name: /create report/i }).click();
  await page.waitForURL(/\/reports\/[a-f0-9-]+/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
});

test("reports list loads", async ({ page }) => {
  await page.goto("/reports");
  await expect(page.getByRole("heading", { level: 1, name: "Reports" })).toBeVisible();
});

test("automation hub loads", async ({ page }) => {
  await page.goto("/automation");
  await expect(page.getByRole("heading", { level: 1, name: "Automation" })).toBeVisible();
});

test("settings diagnostics loads platform sections", async ({ page }) => {
  await page.goto("/settings/diagnostics");
  await expect(page.getByRole("heading", { level: 1, name: "Diagnostics" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Production readiness" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pilot execution readiness" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Deployment readiness" })).toBeVisible();
});

test("billing settings loads", async ({ page }) => {
  await page.goto("/settings/billing");
  await expect(
    page.getByRole("heading", { level: 1, name: /subscription & billing/i }),
  ).toBeVisible();
});

test("compliance center loads", async ({ page }) => {
  await page.goto("/dashboard/compliance");
  await expect(page.getByRole("heading", { level: 1, name: /compliance & governance/i })).toBeVisible();
});

test("API settings loads", async ({ page }) => {
  await page.goto("/settings/api");
  await expect(page.getByRole("heading", { level: 1, name: "Public API" })).toBeVisible();
});

test("skip link targets main content", async ({ page }) => {
  await page.goto("/dashboard");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await skip.click();
  await expect(page.locator("#main-content")).toBeFocused();
});

test.afterAll(() => {
  if (!hasE2ECredentials()) {
    console.info(
      `[e2e] Authenticated flows skipped — set E2E_EMAIL and E2E_PASSWORD (currently: ${e2eCredentials.email ? "email set" : "no email"})`,
    );
  }
});

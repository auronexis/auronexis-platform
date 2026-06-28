import { test, expect } from "@playwright/test";

test.describe("Public smoke", () => {
  test("login page renders sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("signup page renders registration form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Agency name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("protected dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("client portal login renders", async ({ page }) => {
    await page.goto("/client-portal/login");
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("health API returns JSON status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok() || response.status() === 503).toBeTruthy();
    const body = (await response.json()) as {
      status: string;
      version: string;
      checks: { database: boolean };
    };
    expect(body.status).toMatch(/healthy|degraded/);
    expect(body.version).toBe("1.0.3");
    expect(typeof body.checks.database).toBe("boolean");
  });

  test("pilot program page renders application form", async ({ page }) => {
    await page.goto("/pilot-program");
    await expect(page.getByRole("heading", { name: "Founding customer pilot" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply for pilot" })).toBeVisible();
  });

  test("contact page renders lead capture forms", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Talk to our team" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Book demo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  });

  test("marketing home loads without auth redirect loop", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1, name: /monitor clients/i })).toBeVisible();
  });

  test("login page uses text-only branding on light card", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expect(page.getByText("Auroranexis", { exact: true }).first()).toBeVisible();

    const loginCard = page
      .locator("div.max-w-md.rounded-2xl")
      .filter({ has: page.getByRole("heading", { name: "Sign in" }) });
    await expect(loginCard.locator("img")).toHaveCount(0);
    await expect(loginCard.locator("svg")).toHaveCount(0);
  });

  test("marketing navbar logo uses approved composite asset", async ({ page }) => {
    const assetResponse = await page.request.get("/branding/logo-horizontal.png");
    expect(assetResponse.ok()).toBeTruthy();
    expect(assetResponse.headers()["content-type"]).toMatch(/png|octet-stream/);

    await page.goto("/pricing");
    const headerLogo = page.locator("header img[alt='Auroranexis logo']");
    await expect(headerLogo).toBeVisible();
    await expect(headerLogo).toHaveAttribute("src", "/branding/logo-horizontal.png");
  });

  test("required public marketing routes stay public", async ({ page }) => {
    for (const path of ["/pricing", "/pilot-program", "/features", "/privacy", "/imprint"]) {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/login/);
    }
  });
});

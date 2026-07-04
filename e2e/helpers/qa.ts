import { expect, type Page } from "@playwright/test";

const IGNORED_CONSOLE_PATTERNS = [
  /favicon/i,
  /ResizeObserver loop/i,
  /Failed to load resource.*favicon/i,
  /Failed to load resource: the server responded with a status of 400/i,
  /Failed to load resource: the server responded with a status of 404/i,
  /net::ERR_BLOCKED_BY_CLIENT/i,
];

export type PageAuditResult = {
  route: string;
  consoleErrors: string[];
};

export function attachConsoleErrorCollector(page: Page): string[] {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }
    const text = message.text();
    if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) {
      return;
    }
    errors.push(text);
  });

  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

export async function assertNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const scope =
      document.querySelector(".marketing-theme") ??
      document.querySelector("#main-content") ??
      document.body;
    return scope.scrollWidth - scope.clientWidth;
  });
  expect(overflow, "Page should not scroll horizontally").toBeLessThanOrEqual(2);
}

export async function assertNotBlankPage(page: Page): Promise<void> {
  const textLength = await page.locator("body").innerText().then((text) => text.trim().length);
  expect(textLength, "Page body should contain visible text").toBeGreaterThan(40);
}

export async function assertNoServerError(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: /500|internal server error/i })).toHaveCount(0);
  await expect(page.getByText(/Application error: a server-side exception/i)).toHaveCount(0);
}

export async function assertNoAnonymousCtas(page: Page): Promise<void> {
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start free trial" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Book demo" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Try for free" })).toHaveCount(0);
}

export async function assertAuthenticatedPublicNav(page: Page, route: string): Promise<void> {
  await assertNoAnonymousCtas(page);

  if (route === "/") {
    await expect(page).toHaveURL(/\/dashboard/);
    return;
  }

  await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible();
}

export async function assertAppShellLoaded(page: Page): Promise<void> {
  await expect(page.getByRole("status", { name: /Loading workspace/i })).toHaveCount(0, {
    timeout: 20_000,
  });
  await expect(page.locator("#main-content")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
}

export async function assertFooterAtBottom(page: Page, options: { appPage?: boolean } = {}): Promise<void> {
  const footer = page.locator("footer").last();
  await expect(footer).toBeVisible();

  if (options.appPage) {
    return;
  }

  const layout = await page.evaluate(() => {
    const footerEl = document.querySelector("footer:last-of-type");
    const mainEl =
      document.querySelector("#main-content") ??
      document.querySelector("main") ??
      document.querySelector('[role="main"]');
    if (!footerEl || !mainEl) {
      return { valid: true };
    }
    const footerTop = footerEl.getBoundingClientRect().top;
    const mainBottom = mainEl.getBoundingClientRect().bottom;
    return { valid: footerTop + 2 >= mainBottom, footerTop, mainBottom };
  });
  expect(layout.valid, "Footer should render below main content").toBe(true);
}

export async function assertDarkThemeReadable(page: Page): Promise<void> {
  const luminance = await page.evaluate(() => {
    const scope =
      document.querySelector(".marketing-theme") ??
      document.querySelector(".bg-background") ??
      document.body;
    const background = getComputedStyle(scope).backgroundColor;
    const match = background.match(/[\d.]+/g);
    if (!match || match.length < 3) {
      return 0.2;
    }
    const [r, g, b] = match.slice(0, 3).map(Number);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  });
  expect(luminance, "Background should be a dark theme").toBeLessThan(0.45);
}

export async function assertInteractiveControlsVisible(page: Page): Promise<void> {
  const controlCount = await page
    .locator('button:visible, a[href]:visible, input:visible, select:visible, textarea:visible')
    .count();
  expect(controlCount, "Page should expose interactive controls").toBeGreaterThan(0);
}

export async function auditAuthenticatedPublicPage(
  page: Page,
  route: string,
  consoleErrors: string[],
): Promise<void> {
  if (route === "/") {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${route} should not return 5xx`).toBeLessThan(500);
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await assertAppShellLoaded(page);
    await assertNoAnonymousCtas(page);
    expect(consoleErrors, `Console errors on ${route}`).toEqual([]);
    return;
  }

  await auditAuthenticatedPage(page, route, consoleErrors, { publicPage: true });
}

export async function auditAuthenticatedPage(
  page: Page,
  route: string,
  consoleErrors: string[],
  options: { publicPage?: boolean; appPage?: boolean } = {},
): Promise<void> {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `${route} should not return 5xx`).toBeLessThan(500);

  await assertNoServerError(page);

  if (options.appPage) {
    await assertAppShellLoaded(page);
  }

  await assertNotBlankPage(page);

  if (options.publicPage) {
    await expect(page.getByRole("link", { name: "Dashboard" }).first()).toBeVisible({
      timeout: 15_000,
    });
  }

  await assertNoHorizontalScroll(page);

  if (options.publicPage) {
    await assertDarkThemeReadable(page);
  }

  await assertInteractiveControlsVisible(page);
  await assertFooterAtBottom(page, { appPage: options.appPage });

  if (options.publicPage) {
    await assertAuthenticatedPublicNav(page, route);
  }

  expect(consoleErrors, `Console errors on ${route}`).toEqual([]);
}

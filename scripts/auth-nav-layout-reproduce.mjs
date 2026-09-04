/**
 * One-shot forensics: prove whether #main-content retains scrollTop across sidebar nav.
 * Run: npx playwright test e2e/authenticated-nav-layout-reproduce.mjs --config=playwright.config.ts
 * Prefer the .spec.ts suite; this script is optional offline evidence capture.
 */
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) process.env[key] = rawValue;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
const email = process.env.E2E_TEST_EMAIL ?? process.env.E2E_EMAIL ?? "";
const password = process.env.E2E_TEST_PASSWORD ?? process.env.E2E_PASSWORD ?? "";
const outDir = resolve("test-results", "auth-nav-layout-forensics");

async function capture(page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content");
    const content = main?.firstElementChild;
    const mainRect = main?.getBoundingClientRect();
    const contentRect = content?.getBoundingClientRect();
    return {
      url: location.pathname,
      windowScrollY: window.scrollY,
      mainScrollTop: main?.scrollTop ?? null,
      mainScrollHeight: main?.scrollHeight ?? null,
      mainClientHeight: main?.clientHeight ?? null,
      contentTopViewport: contentRect?.top ?? null,
      mainTopViewport: mainRect?.top ?? null,
      gapContentBelowMainTop:
        mainRect && contentRect ? contentRect.top - mainRect.top : null,
    };
  });
}

async function main() {
  if (!email || !password) {
    console.error("Missing E2E credentials");
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1660, height: 900 },
    colorScheme: "dark",
  });
  await page.goto(`${baseURL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 30_000 });
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 20_000 });

  const snaps = [];
  snaps.push({ label: "hard-load-dashboard", ...(await capture(page)) });
  await page.screenshot({ path: resolve(outDir, "repro-00-hard.png") });

  await page.evaluate(() => {
    const main = document.querySelector("#main-content");
    if (main) main.scrollTop = main.scrollHeight;
  });
  snaps.push({ label: "scrolled-dashboard", ...(await capture(page)) });
  await page.screenshot({ path: resolve(outDir, "repro-01-scrolled.png") });

  await page.locator('nav[aria-label="Primary"]').getByRole("link", { name: /^Clients\b/i }).click();
  await page.waitForURL("**/clients**", { timeout: 30_000 });
  await page.waitForTimeout(400);
  snaps.push({ label: "after-sidebar-clients", ...(await capture(page)) });
  await page.screenshot({ path: resolve(outDir, "repro-02-clients-client-nav.png") });

  // Ancestor chain of route content
  const chain = await page.evaluate(() => {
    const main = document.querySelector("#main-content");
    const target = main?.querySelector("h1, h2, [class*='space-y']") ?? main?.firstElementChild;
    const rows = [];
    let el = target;
    while (el && el !== document.documentElement) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      rows.push({
        tag: el.tagName,
        id: el.id || null,
        className: typeof el.className === "string" ? el.className.slice(0, 160) : null,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        offsetHeight: el.offsetHeight,
        scrollTop: el.scrollTop,
        top: r.top,
        bottom: r.bottom,
        display: cs.display,
        position: cs.position,
        overflow: cs.overflow,
        overflowY: cs.overflowY,
        height: cs.height,
        minHeight: cs.minHeight,
        margin: cs.margin,
        padding: cs.padding,
      });
      el = el.parentElement;
    }
    return rows;
  });

  const report = { baseURL, snaps, ancestorChain: chain };
  writeFileSync(resolve(outDir, "reproduce-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

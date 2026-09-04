/**
 * Measure dashboard geometry with optional details open.
 * Usage: node scripts/p0-overview-viewport-matrix.mjs
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

const baseURL = process.env.BASE_URL ?? "https://www.auroranexis.com";
const email = process.env.E2E_TEST_EMAIL ?? "";
const password = process.env.E2E_TEST_PASSWORD ?? "";
const openDetails = process.env.OPEN_DETAILS === "1";

const viewports = [
  { w: 1660, h: 900 },
  { w: 1280, h: 900 },
  { w: 1024, h: 900 },
  { w: 1000, h: 900 },
  { w: 900, h: 900 },
  { w: 768, h: 900 },
];

async function measure(page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content");
    if (!main) return null;
    const ov = main.querySelector("[data-operations-tab-active='true']");
    const footer = main.querySelector("footer");
    const mainRect = main.getBoundingClientRect();
    const motion = main.querySelector("[class*='motion-page']");
    const footerBottom = footer
      ? Math.round(footer.getBoundingClientRect().bottom - mainRect.top + main.scrollTop)
      : 0;
    const sections = [...main.querySelectorAll("section[aria-label]")].map((el) => ({
      aria: el.getAttribute("aria-label"),
      h: el.offsetHeight,
    }));
    return {
      SH: main.scrollHeight,
      CH: main.clientHeight,
      overview: ov?.offsetHeight ?? null,
      contentW: Math.round(motion?.getBoundingClientRect().width ?? 0),
      lg: matchMedia("(min-width: 1024px)").matches,
      md: matchMedia("(min-width: 768px)").matches,
      sm: matchMedia("(min-width: 640px)").matches,
      xl: matchMedia("(min-width: 1280px)").matches,
      footerBottom,
      excess: main.scrollHeight - footerBottom,
      ops: sections.find((s) => s.aria === "Operations")?.h ?? null,
      exec: sections.find((s) => s.aria === "Executive intelligence")?.h ?? null,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1660, height: 900 } });
await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.fill('input[type="email"], input[name="email"]', email);
await page.fill('input[type="password"], input[name="password"]', password);
await page.click('button[type="submit"]');
await page.waitForURL(/dashboard|clients/, { timeout: 90_000 }).catch(() => null);

const results = [];
for (const vp of viewports) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForFunction(
    () => Boolean(document.querySelector("[data-operations-center]")),
    null,
    { timeout: 90_000 },
  );
  await page.waitForTimeout(500);
  if (openDetails) {
    const summaries = page.locator("summary");
    const count = await summaries.count();
    for (let i = 0; i < count; i++) {
      const el = summaries.nth(i);
      const open = await el.evaluate((node) => node.parentElement?.hasAttribute("open"));
      if (!open) await el.click().catch(() => null);
    }
    await page.waitForTimeout(400);
  }
  const m = await measure(page);
  results.push({ viewport: vp, openDetails, ...m });
  console.log(JSON.stringify(results[results.length - 1]));
}

mkdirSync(".recert-evidence", { recursive: true });
const out = resolve(
  `.recert-evidence/p0-overview-viewport-matrix${openDetails ? "-details" : ""}.json`,
);
writeFileSync(out, JSON.stringify(results, null, 2));
console.log(`Wrote ${out}`);
await browser.close();

/**
 * Dashboard UX density measurement at 1660×900.
 * Run: node scripts/dashboard-ux-density-measure.mjs
 * Optional: BASE_URL=http://127.0.0.1:3005 VIEWPORT=1660x900
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

const baseURL = process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
const email = process.env.E2E_TEST_EMAIL ?? process.env.E2E_EMAIL ?? "";
const password = process.env.E2E_TEST_PASSWORD ?? process.env.E2E_PASSWORD ?? "";
const [vw, vh] = (process.env.VIEWPORT ?? "1660x900").split("x").map(Number);
const outDir = resolve(".recert-evidence");
mkdirSync(outDir, { recursive: true });

async function login(page) {
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|clients|\/app/, { timeout: 60_000 }).catch(() => null);
}

async function measure(page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content");
    if (!main) return { error: "no #main-content" };
    const mainRect = main.getBoundingClientRect();
    const sections = [...main.querySelectorAll("section[aria-label]")].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        label: el.getAttribute("aria-label"),
        top: Math.round(r.top - mainRect.top + main.scrollTop),
        bottom: Math.round(r.bottom - mainRect.top + main.scrollTop),
        height: Math.round(r.height),
      };
    });
    const ops = sections.find((s) => s.label === "Operations");
    const footer = main.querySelector("footer");
    const contentRoot = main.firstElementChild;
    const bottomOf = (el) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return Math.round(r.bottom - mainRect.top + main.scrollTop);
    };
    return {
      url: location.href,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      clientHeight: main.clientHeight,
      scrollHeight: main.scrollHeight,
      contentBottom: Math.max(bottomOf(footer), bottomOf(contentRoot)),
      opsHeight: ops?.height ?? null,
      activeTab:
        main
          .querySelector('[data-operations-tab-active="true"]')
          ?.getAttribute("data-operations-tab") ?? null,
      sections,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: vw, height: vh } });

if (!email || !password) {
  console.error("Missing E2E credentials");
  process.exit(1);
}

await login(page);
await page.goto(`${baseURL}/dashboard`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const result = await measure(page);
const outPath = resolve(outDir, `dashboard-ux-density-${vw}x${vh}.json`);
writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
console.log(`Wrote ${outPath}`);
await browser.close();

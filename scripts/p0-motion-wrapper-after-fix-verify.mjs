/**
 * Post-fix verification: force-unhide ops tabs must NOT inflate scrollHeight.
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

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:3005";
const email = process.env.E2E_TEST_EMAIL ?? process.env.E2E_EMAIL ?? "";
const password = process.env.E2E_TEST_PASSWORD ?? process.env.E2E_PASSWORD ?? "";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1660, height: 900 } });
page.setDefaultTimeout(60_000);

await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[type="email"], input[name="email"]', email);
await page.fill('input[type="password"], input[name="password"]', password);
await page.click('button[type="submit"]');
await page.waitForURL(/dashboard|clients/, { timeout: 60_000 });
await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

const result = await page.evaluate(() => {
  const main = document.querySelector("#main-content");
  if (!main) return { error: "no main" };
  const motion = main.querySelector('[class*="motion-page"]');
  const panels = [...document.querySelectorAll("[data-operations-center] [role=tabpanel]")];
  const before = {
    SH: main.scrollHeight,
    motion: motion?.offsetHeight ?? null,
    panels: panels.map((p) => ({
      tab: p.getAttribute("data-operations-tab"),
      h: p.offsetHeight,
      kids: p.childElementCount,
      hidden: p.hidden,
      display: getComputedStyle(p).display,
    })),
  };
  for (const p of panels) {
    p.hidden = false;
    p.style.display = "block";
    p.classList.remove("hidden");
  }
  const after = {
    SH: main.scrollHeight,
    motion: motion?.offsetHeight ?? null,
    panels: panels.map((p) => ({
      tab: p.getAttribute("data-operations-tab"),
      h: p.offsetHeight,
      kids: p.childElementCount,
    })),
  };
  return {
    before,
    after,
    deltaSH: after.SH - before.SH,
    welcome: /Welcome,/i.test(main.innerText || ""),
    href: location.href,
    mountMode: main.querySelector("[data-operations-center]")?.getAttribute("data-ops-mount"),
    opsOuter: main.querySelector("[data-operations-center]")?.outerHTML?.slice(0, 200) ?? null,
    inactiveInnerPreview: panels
      .filter((p) => p.getAttribute("data-operations-tab-active") !== "true")
      .map((p) => ({
        tab: p.getAttribute("data-operations-tab"),
        innerLen: p.innerHTML.length,
        innerPreview: p.innerHTML.slice(0, 120),
      })),
  };
});

mkdirSync(".recert-evidence", { recursive: true });
const out = resolve(".recert-evidence/p0-motion-wrapper-after-fix.json");
writeFileSync(out, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
console.log(`Wrote ${out}`);
await browser.close();

if (result.error) process.exit(1);
if ((result.after?.SH ?? 99999) > 4500) {
  console.error("FAIL: forced-unhide scrollHeight still excessive");
  process.exit(1);
}
if ((result.deltaSH ?? 99999) > 200) {
  console.error("FAIL: forced-unhide still inflates scrollHeight materially");
  process.exit(1);
}
console.log("PASS: inactive ops content unmounted; forced-unhide cannot recreate ~6820px blank");

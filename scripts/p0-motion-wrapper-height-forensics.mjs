/**
 * P0 motion-page wrapper height forensics.
 * Binary-searches lowest height-owning descendant under #main-content.
 * Run: node scripts/p0-motion-wrapper-height-forensics.mjs
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

function snapshotScript() {
  return () => {
    const main = document.querySelector("#main-content");
    if (!main) return { error: "no #main-content" };

    const cs = (el) => {
      const s = getComputedStyle(el);
      return {
        display: s.display,
        position: s.position,
        height: s.height,
        minHeight: s.minHeight,
        maxHeight: s.maxHeight,
        overflow: s.overflow,
        overflowY: s.overflowY,
        transform: s.transform,
        opacity: s.opacity,
        animation: s.animation,
        flex: `${s.flexGrow} ${s.flexShrink} ${s.flexBasis}`,
        visibility: s.visibility,
      };
    };

    const geo = (el) => {
      const r = el.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      return {
        tag: el.tagName,
        id: el.id || null,
        className: (el.className && String(el.className).slice(0, 120)) || "",
        aria: el.getAttribute("aria-label"),
        hiddenAttr: el.hasAttribute("hidden"),
        hiddenProp: /** @type {HTMLElement} */ (el).hidden,
        offsetHeight: /** @type {HTMLElement} */ (el).offsetHeight,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        childCount: el.childElementCount,
        top: Math.round(r.top - mainRect.top + main.scrollTop),
        bottom: Math.round(r.bottom - mainRect.top + main.scrollTop),
        height: Math.round(r.height),
        styles: cs(el),
      };
    };

    /** Walk to lowest descendant that still owns ≥95% of parent height. */
    function lowestHeightOwner(root, minRatio = 0.95) {
      const chain = [];
      let node = root;
      while (node) {
        const info = geo(node);
        chain.push(info);
        const parentH = Math.max(1, info.offsetHeight || info.height);
        let best = null;
        for (const child of node.children) {
          const ch = /** @type {HTMLElement} */ (child);
          if (ch.hidden || getComputedStyle(ch).display === "none") continue;
          const h = ch.offsetHeight;
          if (!best || h > best.h) best = { el: ch, h };
        }
        if (!best || best.h < parentH * minRatio) break;
        node = best.el;
      }
      return chain;
    }

    const motion = main.querySelector('[class*="motion-page"]');
    const opsCenter = main.querySelector("[data-operations-center]");
    const tabs = opsCenter
      ? [...opsCenter.querySelectorAll('[role="tabpanel"]')].map((el) => {
          const g = geo(el);
          return {
            ...g,
            tab: el.getAttribute("data-operations-tab"),
            active: el.getAttribute("data-operations-tab-active"),
            displayNone: g.styles.display === "none",
          };
        })
      : [];

    const sections = [...main.querySelectorAll("section[aria-label]")].map((el) => geo(el));
    const welcome = [...main.querySelectorAll("h1,h2,p,div")].find((el) =>
      /Welcome,\s*/i.test(el.textContent || ""),
    );

    const footer = main.querySelector("footer");
    const contentRoot = main.firstElementChild;

    return {
      url: location.href,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      main: {
        clientHeight: main.clientHeight,
        scrollHeight: main.scrollHeight,
        scrollTop: main.scrollTop,
        childCount: main.childElementCount,
        styles: cs(main),
      },
      motion: motion ? geo(motion) : null,
      motionChildChain: motion
        ? [...motion.children].map((c) => geo(/** @type {HTMLElement} */ (c)))
        : [],
      lowestOwnerFromMotion: motion ? lowestHeightOwner(motion) : [],
      opsTabs: tabs,
      opsTabHeightSum: tabs.reduce((n, t) => n + (t.offsetHeight || 0), 0),
      opsVisibleTabHeightSum: tabs
        .filter((t) => !t.displayNone && !t.hiddenAttr)
        .reduce((n, t) => n + (t.offsetHeight || 0), 0),
      sections,
      welcomeVisible: Boolean(welcome),
      welcomeText: welcome ? (welcome.textContent || "").trim().slice(0, 80) : null,
      footer: footer ? geo(footer) : null,
      contentRoot: contentRoot ? geo(/** @type {HTMLElement} */ (contentRoot)) : null,
      unexplainedAfterFooter: footer
        ? main.scrollHeight - geo(footer).bottom
        : null,
    };
  };
}

async function measure(page) {
  return page.evaluate(snapshotScript());
}

async function settle(page) {
  await page.waitForTimeout(1200);
  await page.waitForFunction(() => {
    const main = document.querySelector("#main-content");
    if (!main) return false;
    const t = main.innerText || "";
    return !t.includes("Loading content") && main.scrollHeight > 200;
  });
  await page.waitForTimeout(400);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: vw, height: vh } });

if (!email || !password) {
  console.error("Missing E2E credentials");
  process.exit(1);
}

await login(page);

const cases = {};

// A hard load
await page.goto(`${baseURL}/dashboard`, { waitUntil: "networkidle" });
await settle(page);
cases.A_hard_load = await measure(page);

// B sidebar other → dashboard
const clientsLink = page.locator('aside a[href="/clients"], nav a[href="/clients"]').first();
if (await clientsLink.count()) {
  await clientsLink.click();
  await page.waitForURL(/\/clients/, { timeout: 30_000 }).catch(() => null);
  await settle(page);
  const dashLink = page.locator('aside a[href="/dashboard"], nav a[href="/dashboard"]').first();
  await dashLink.click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 }).catch(() => null);
  await settle(page);
  cases.B_sidebar_other_to_dashboard = await measure(page);
}

// C dashboard → other → dashboard
if (await clientsLink.count()) {
  await clientsLink.click();
  await page.waitForURL(/\/clients/, { timeout: 30_000 }).catch(() => null);
  await settle(page);
  await page.locator('aside a[href="/dashboard"], nav a[href="/dashboard"]').first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 }).catch(() => null);
  await settle(page);
  cases.C_dashboard_roundtrip = await measure(page);
}

// D back/forward
await page.goBack({ waitUntil: "networkidle" }).catch(() => null);
await settle(page);
await page.goForward({ waitUntil: "networkidle" }).catch(() => null);
await settle(page);
cases.D_back_forward = await measure(page);

// E hard reload
await page.reload({ waitUntil: "networkidle" });
await settle(page);
cases.E_hard_reload = await measure(page);

const outPath = resolve(outDir, `p0-motion-wrapper-height-${vw}x${vh}.json`);
writeFileSync(outPath, JSON.stringify(cases, null, 2));

const summary = Object.fromEntries(
  Object.entries(cases).map(([k, v]) => [
    k,
    {
      scrollHeight: v.main?.scrollHeight,
      motionH: v.motion?.offsetHeight,
      welcome: v.welcomeVisible,
      opsTabs: v.opsTabs?.map((t) => ({
        tab: t.tab,
        hidden: t.hiddenAttr,
        display: t.styles?.display,
        h: t.offsetHeight,
      })),
      opsTabHeightSum: v.opsTabHeightSum,
      opsVisibleTabHeightSum: v.opsVisibleTabHeightSum,
      lowestTail: v.lowestOwnerFromMotion?.slice(-3).map((n) => ({
        className: n.className,
        aria: n.aria,
        h: n.offsetHeight,
        display: n.styles?.display,
      })),
      unexplainedAfterFooter: v.unexplainedAfterFooter,
    },
  ]),
);
console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote ${outPath}`);
await browser.close();

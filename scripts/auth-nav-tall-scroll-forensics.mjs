/**
 * One-shot tall-route scroll forensics across sidebar navigations.
 * Run: node scripts/auth-nav-tall-scroll-forensics.mjs
 * Does not modify src/. Expects Next at PLAYWRIGHT_BASE_URL (default http://127.0.0.1:3005).
 */
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const storageStatePath = resolve("e2e", ".auth", "user.json");
const outDir = resolve("test-results", "auth-nav-layout-forensics");
const outFile = resolve(outDir, "tall-scroll-forensics.json");

const ROUTE_PAIRS = [
  { from: "/dashboard", to: "/settings", linkName: /^Settings\b/i },
  { from: "/settings", to: "/dashboard", linkName: /^Dashboard\b/i },
  { from: "/dashboard", to: "/sales", linkName: /^Sales\b/i },
  { from: "/sales", to: "/clients", linkName: /^Clients\b/i },
  { from: "/clients", to: "/dashboard", linkName: /^Dashboard\b/i },
];

const SAMPLE_DELAYS_MS = [0, 50, 200, 500];

async function dismissCookieConsent(page) {
  const names = [
    /Accept all/i,
    /Accept All/i,
    /Reject non-essential/i,
    /Reject Non-Essential/i,
    /Reject all/i,
    /Only essential/i,
    /Allow all/i,
    /Got it/i,
    /I agree/i,
  ];
  for (const name of names) {
    const btn = page.getByRole("button", { name });
    if (await btn.count().catch(() => 0)) {
      const first = btn.first();
      if (await first.isVisible().catch(() => false)) {
        await first.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(200);
        return true;
      }
    }
  }
  return false;
}

async function ensureAuth(context, page) {
  if (existsSync(storageStatePath)) {
    await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
    await dismissCookieConsent(page);
    const onLogin =
      page.url().includes("/login") ||
      (await page.getByLabel("Email").count().catch(() => 0)) > 0;
    if (!onLogin) {
      await page.locator("#main-content").waitFor({ state: "visible", timeout: 25_000 });
      return { mode: "storageState", path: storageStatePath };
    }
  }

  if (!email || !password) {
    throw new Error("Missing E2E_TEST_EMAIL/PASSWORD and storageState login failed");
  }

  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" });
  await dismissCookieConsent(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 45_000 });
  await dismissCookieConsent(page);
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 25_000 });
  return { mode: "credentials", email };
}

async function capture(page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content");
    const content = main?.firstElementChild ?? null;
    const mainRect = main?.getBoundingClientRect() ?? null;
    const contentRect = content?.getBoundingClientRect() ?? null;
    return {
      url: location.pathname,
      windowScrollY: window.scrollY,
      mainScrollTop: main?.scrollTop ?? null,
      mainScrollHeight: main?.scrollHeight ?? null,
      mainClientHeight: main?.clientHeight ?? null,
      mainRect: mainRect
        ? { top: mainRect.top, bottom: mainRect.bottom, height: mainRect.height }
        : null,
      contentRect: contentRect
        ? {
            top: contentRect.top,
            bottom: contentRect.bottom,
            height: contentRect.height,
            width: contentRect.width,
          }
        : null,
      contentAboveMainViewport:
        mainRect && contentRect
          ? contentRect.bottom < mainRect.top + 50
          : null,
      gapContentBelowMainTop:
        mainRect && contentRect ? contentRect.top - mainRect.top : null,
    };
  });
}

async function setMainScroll(page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content");
    if (!main) return { ok: false };
    const max = Math.max(0, main.scrollHeight - main.clientHeight);
    const target = Math.min(600, max);
    main.scrollTop = target > 0 ? target : 400;
    if (main.scrollTop < 40 && max > 0) {
      main.scrollTop = Math.min(400, max);
    }
    if (main.scrollTop === 0) {
      main.scrollTop = 400;
    }
    return {
      ok: true,
      applied: main.scrollTop,
      max,
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
    };
  });
}

async function clickSidebarTo(page, linkName) {
  const nav = page.locator('nav[aria-label="Primary"]');
  await nav.getByRole("link", { name: linkName }).first().click({ noWaitAfter: true });
}

async function sampleAfterClick(page) {
  const samples = [];
  samples.push({ delayMs: "immediate", ...(await capture(page)), t: Date.now() });
  const t0 = samples[0].t;
  for (const delay of SAMPLE_DELAYS_MS) {
    const elapsed = Date.now() - t0;
    const remaining = delay - elapsed;
    if (remaining > 0) await page.waitForTimeout(remaining);
    samples.push({ delayMs: delay, ...(await capture(page)), t: Date.now() });
  }
  return samples;
}

async function walkHeadingAncestors(page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content");
    const heading =
      main?.querySelector("h1, h2, h3") ?? main?.firstElementChild ?? null;
    const rows = [];
    let el = heading;
    while (el && el !== document.documentElement) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      rows.push({
        tag: el.tagName,
        id: el.id || null,
        className:
          typeof el.className === "string" ? el.className.slice(0, 200) : null,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        offsetHeight: el.offsetHeight,
        scrollTop: el.scrollTop,
        top: r.top,
        bottom: r.bottom,
        height: r.height,
        display: cs.display,
        position: cs.position,
        overflow: cs.overflow,
        overflowY: cs.overflowY,
        cssHeight: cs.height,
        minHeight: cs.minHeight,
        transform: cs.transform,
      });
      el = el.parentElement;
    }
    return rows;
  });
}

async function runPair(page, pair) {
  await page.goto(`${baseURL}${pair.from}`, {
    waitUntil: "domcontentloaded",
  });
  await dismissCookieConsent(page);
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 25_000 });
  await page.waitForTimeout(300);

  const scrollApply = await setMainScroll(page);
  const before = await capture(page);

  await clickSidebarTo(page, pair.linkName);
  const afterSamples = await sampleAfterClick(page);

  await page
    .waitForURL(`**${pair.to}**`, { timeout: 30_000 })
    .catch(() => {});
  await page.waitForTimeout(100);

  const at200 = afterSamples.find((s) => s.delayMs === 200);
  const retained =
    typeof at200?.mainScrollTop === "number" ? at200.mainScrollTop : null;

  return {
    pair: `${pair.from} → ${pair.to}`,
    from: pair.from,
    to: pair.to,
    scrollApply,
    before,
    afterSamples,
    retainedScrollTopAt200ms: retained,
    retainedAbove40At200ms: retained != null && retained > 40,
  };
}

async function runContentAboveViewportProbe(page) {
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await dismissCookieConsent(page);
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 25_000 });
  await page.waitForTimeout(300);
  const scrollApply = await setMainScroll(page);
  const before = await capture(page);

  await clickSidebarTo(page, /^Settings\b/i);
  const afterSamples = await sampleAfterClick(page);
  await page.waitForURL("**/settings**", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(200);

  const late = afterSamples.find((s) => s.delayMs === 500) ?? afterSamples.at(-1);
  const contentAbove =
    late?.contentAboveMainViewport === true ||
    (late?.contentRect &&
      late?.mainRect &&
      late.contentRect.bottom < late.mainRect.top + 50);

  const ancestorChain = await walkHeadingAncestors(page);

  return {
    label: "dashboard-scroll → settings; content-above-main probe",
    scrollApply,
    before,
    afterSamples,
    contentTopAboveMainViewport: Boolean(contentAbove),
    lateSnapshot: late,
    ancestorChainAfterBrokenState: ancestorChain,
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const contextOptions = {
    viewport: { width: 1660, height: 900 },
    colorScheme: "dark",
    baseURL,
  };
  if (existsSync(storageStatePath)) {
    contextOptions.storageState = storageStatePath;
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  const auth = await ensureAuth(context, page);

  const transitions = [];
  for (const pair of ROUTE_PAIRS) {
    transitions.push(await runPair(page, pair));
  }

  const contentAboveProbe = await runContentAboveViewportProbe(page);

  const allScrollTopsAt200 = [
    ...transitions.map((t) => t.retainedScrollTopAt200ms),
    contentAboveProbe.afterSamples?.find((s) => s.delayMs === 200)?.mainScrollTop ??
      null,
  ].filter((n) => typeof n === "number");

  const anyRetainedAbove40 = allScrollTopsAt200.some((n) => n > 40);
  const maxRetainedScrollTop = allScrollTopsAt200.length
    ? Math.max(...allScrollTopsAt200)
    : null;

  const report = {
    generatedAt: new Date().toISOString(),
    baseURL,
    viewport: { width: 1660, height: 900 },
    colorScheme: "dark",
    auth,
    buildNote:
      "Server assumed UNFIXED if .next lacks dashboard-sidebar main.scrollTop=0 on pathname",
    transitions,
    contentAboveProbe,
    summary: {
      anyTransitionRetainedMainScrollTopAbove40After200ms: anyRetainedAbove40,
      maxRetainedScrollTopObservedAt200ms: maxRetainedScrollTop,
      perTransitionAt200ms: transitions.map((t) => ({
        pair: t.pair,
        retainedScrollTopAt200ms: t.retainedScrollTopAt200ms,
        retainedAbove40: t.retainedAbove40At200ms,
        beforeScrollTop: t.before?.mainScrollTop ?? null,
      })),
      contentTopAboveMainViewport: contentAboveProbe.contentTopAboveMainViewport,
    },
  };

  writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log("=== tall-scroll-forensics summary ===");
  console.log(`Wrote: ${outFile}`);
  console.log(
    `ANY retained mainScrollTop > 40 after 200ms: ${anyRetainedAbove40}`
  );
  console.log(`Max retained scrollTop @200ms: ${maxRetainedScrollTop}`);
  for (const t of transitions) {
    console.log(
      `  ${t.pair}: before=${t.before?.mainScrollTop} → @200ms=${t.retainedScrollTopAt200ms}`
    );
  }
  console.log(
    `contentAboveMainViewport (dashboard→settings): ${contentAboveProbe.contentTopAboveMainViewport}`
  );
  console.log(
    `ancestorChain rows: ${contentAboveProbe.ancestorChainAfterBrokenState?.length ?? 0}`
  );

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
/**
 * Auth soft-nav opacity forensics: does PageTransition / motion-page-enter leave
 * main content at near-zero opacity after navigation settles?
 *
 * Run: node scripts/auth-nav-opacity-forensics.mjs
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
const outFile = resolve(outDir, "opacity-forensics.json");

const SAMPLE_OFFSETS_MS = [0, 16, 50, 100, 150, 200, 400, 800];

const NAV_TARGETS = [
  { label: "Clients", nameRe: /^Clients\b/i, urlHint: "/clients" },
  { label: "Settings", nameRe: /^Settings\b/i, urlHint: "/settings" },
  { label: "Sales", nameRe: /^Sales\b/i, urlHint: "/sales" },
  { label: "Dashboard", nameRe: /^Dashboard\b/i, urlHint: "/dashboard" },
];

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

async function ensureAuth(page) {
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

/** Snapshot opacity / geometry for main content tree + motion-page-enter nodes. */
function measureOpacitySnapshot() {
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const opacityOf = (el) => {
    if (!el) return null;
    const o = parseFloat(cs(el).opacity);
    return Number.isFinite(o) ? o : null;
  };
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      className: typeof el.className === "string" ? el.className.slice(0, 200) : null,
      opacity: opacityOf(el),
      clientHeight: el.clientHeight,
      clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight,
      offsetHeight: el.offsetHeight,
      rectHeight: r.height,
      visibility: cs(el).visibility,
      display: cs(el).display,
    };
  };

  const main = document.querySelector("#main-content");
  const pageTransition = main?.querySelector(":scope > div") ?? null;
  let firstContentChild = null;
  if (pageTransition) {
    firstContentChild = pageTransition.firstElementChild;
  } else if (main) {
    firstContentChild = main.firstElementChild;
  }

  const motionNodes = Array.from(
    document.querySelectorAll('[class*="motion-page-enter"]')
  ).map((el) => {
    const style = cs(el);
    return {
      ...box(el),
      animationName: style.animationName,
      animationPlayState: style.animationPlayState,
      animationFillMode: style.animationFillMode,
      animationDuration: style.animationDuration,
      animationDelay: style.animationDelay,
      insideMain: Boolean(main && main.contains(el)),
    };
  });

  return {
    url: location.pathname + location.search,
    t: performance.now(),
    main: box(main),
    pageTransition: box(pageTransition),
    firstContentChild: box(firstContentChild),
    motionPageEnter: motionNodes,
    motionPageEnterCount: motionNodes.length,
  };
}

async function takeOpacitySnapshot(page) {
  return page.evaluate(measureOpacitySnapshot);
}

async function forceCheckHiddenTall(page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content");
    if (!main) return { ok: false, reason: "no #main-content", offenders: [] };
    const offenders = [];
    const walk = (el) => {
      if (!(el instanceof Element)) return;
      const style = getComputedStyle(el);
      const opacity = parseFloat(style.opacity);
      if (
        Number.isFinite(opacity) &&
        opacity === 0 &&
        el.clientHeight > 400
      ) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          className:
            typeof el.className === "string" ? el.className.slice(0, 200) : null,
          opacity,
          clientHeight: el.clientHeight,
          clientWidth: el.clientWidth,
        });
      }
      for (const child of el.children) walk(child);
    };
    walk(main);
    return {
      ok: true,
      url: location.pathname + location.search,
      offenderCount: offenders.length,
      offenders: offenders.slice(0, 40),
    };
  });
}

async function sampleAfterClick(page, nameRe) {
  const nav = page.locator('nav[aria-label="Primary"]');
  await nav.waitFor({ state: "visible", timeout: 15_000 });
  const link = nav.getByRole("link", { name: nameRe }).first();
  await link.waitFor({ state: "visible", timeout: 10_000 });

  const before = await takeOpacitySnapshot(page);
  const clickAt = Date.now();
  await link.click({ noWaitAfter: true });

  const samples = [];
  for (const offset of SAMPLE_OFFSETS_MS) {
    const elapsed = Date.now() - clickAt;
    const wait = offset - elapsed;
    if (wait > 0) await page.waitForTimeout(wait);
    const snap = await takeOpacitySnapshot(page);
    samples.push({
      offsetMs: offset,
      actualElapsedMs: Date.now() - clickAt,
      url: page.url(),
      pathname: new URL(page.url()).pathname,
      ...snap,
    });
  }

  // Settle a bit more, then force-check for opacity:0 + tall nodes
  const sinceClick = Date.now() - clickAt;
  if (sinceClick < 500) await page.waitForTimeout(500 - sinceClick);
  const hiddenTallAt500 = await forceCheckHiddenTall(page);
  await page.waitForTimeout(100);
  const settled = await takeOpacitySnapshot(page);
  const motionAnimCheck = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[class*="motion-page-enter"]'));
    return nodes.map((el) => {
      const style = getComputedStyle(el);
      return {
        className:
          typeof el.className === "string" ? el.className.slice(0, 200) : null,
        opacity: parseFloat(style.opacity),
        clientHeight: el.clientHeight,
        animationName: style.animationName,
        animationPlayState: style.animationPlayState,
        animationFillMode: style.animationFillMode,
        animationDuration: style.animationDuration,
      };
    });
  });

  return {
    before,
    samples,
    hiddenTallAt500ms: hiddenTallAt500,
    settledAfter500Plus: settled,
    motionAnimationCheck: motionAnimCheck,
  };
}

function isNearZeroOpacity(opacity) {
  return typeof opacity === "number" && opacity < 0.1;
}

function isLargeHeight(box) {
  if (!box) return false;
  const h = box.clientHeight ?? box.rectHeight ?? 0;
  return typeof h === "number" && h > 400;
}

function analyzeNav(run) {
  const settledSamples = (run.samples || []).filter((s) => s.offsetMs > 400);
  // Also include settledAfter500Plus as a settled state
  const settledStates = [
    ...settledSamples,
    run.settledAfter500Plus
      ? { offsetMs: "settled500+", ...run.settledAfter500Plus }
      : null,
  ].filter(Boolean);

  const stuckFlags = [];
  for (const s of settledStates) {
    const motionStuck = (s.motionPageEnter || []).some(
      (m) => isNearZeroOpacity(m.opacity) && isLargeHeight(m)
    );
    const wrapperStuck =
      isNearZeroOpacity(s.pageTransition?.opacity) && isLargeHeight(s.pageTransition);
    const mainStuck =
      isNearZeroOpacity(s.main?.opacity) && isLargeHeight(s.main);
    const hasMotionClass = (s.motionPageEnterCount ?? 0) > 0;
    if (motionStuck || wrapperStuck || mainStuck) {
      stuckFlags.push({
        offsetMs: s.offsetMs,
        url: s.url || s.pathname,
        motionStuck,
        wrapperStuck,
        mainStuck,
        hasMotionClass,
        mainOpacity: s.main?.opacity ?? null,
        pageTransitionOpacity: s.pageTransition?.opacity ?? null,
        motionOpacities: (s.motionPageEnter || []).map((m) => m.opacity),
      });
    }
  }

  // Also: settled state still has motion-page-enter with opacity < 0.1 (even without height gate for the YES question)
  // User asked: YES if any settled (>400ms) post-nav state has motion-page-enter OR main content wrapper at opacity < 0.1 with large height.
  const yesFlags = [];
  for (const s of settledStates) {
    const largeMotionNearZero = (s.motionPageEnter || []).some(
      (m) => isNearZeroOpacity(m.opacity) && isLargeHeight(m)
    );
    const motionPresentNearZero = (s.motionPageEnter || []).some((m) =>
      isNearZeroOpacity(m.opacity)
    );
    // Interpret: (motion-page-enter OR main content wrapper) at opacity < 0.1 with large height
    const motionAtLowOpacityLarge =
      (s.motionPageEnter || []).some(
        (m) => isNearZeroOpacity(m.opacity) && isLargeHeight(m)
      ) ||
      ((s.motionPageEnterCount ?? 0) > 0 &&
        isNearZeroOpacity(
          (s.motionPageEnter || [])[0]?.opacity ?? null
        ) &&
        isLargeHeight((s.motionPageEnter || [])[0]));
    const wrapperAtLowOpacityLarge =
      isNearZeroOpacity(s.pageTransition?.opacity) && isLargeHeight(s.pageTransition);
    const mainWrapperAtLowOpacityLarge =
      wrapperAtLowOpacityLarge ||
      (isNearZeroOpacity(s.main?.opacity) && isLargeHeight(s.main));

    if (motionAtLowOpacityLarge || mainWrapperAtLowOpacityLarge) {
      yesFlags.push({
        offsetMs: s.offsetMs,
        url: s.url || s.pathname,
        motionAtLowOpacityLarge,
        mainWrapperAtLowOpacityLarge,
        motionPresentNearZero,
        largeMotionNearZero,
        mainOpacity: s.main?.opacity ?? null,
        pageTransitionOpacity: s.pageTransition?.opacity ?? null,
        motionPageEnterCount: s.motionPageEnterCount ?? 0,
      });
    }
  }

  const opacityTimeline = (run.samples || []).map((s) => ({
    offsetMs: s.offsetMs,
    pathname: s.pathname,
    mainOpacity: s.main?.opacity ?? null,
    pageTransitionOpacity: s.pageTransition?.opacity ?? null,
    firstChildOpacity: s.firstContentChild?.opacity ?? null,
    motionCount: s.motionPageEnterCount ?? 0,
    motionOpacities: (s.motionPageEnter || []).map((m) => m.opacity),
    motionAnim: (s.motionPageEnter || []).map((m) => ({
      animationName: m.animationName,
      animationPlayState: m.animationPlayState,
      animationFillMode: m.animationFillMode,
    })),
  }));

  return {
    stuckAtSettled: stuckFlags.length > 0,
    stuckFlags,
    yesLowOpacityLargeHeight: yesFlags.length > 0,
    yesFlags,
    opacityTimeline,
    hiddenTallOffenderCount: run.hiddenTallAt500ms?.offenderCount ?? 0,
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  try {
    await fetch(baseURL, { method: "GET", redirect: "manual" });
  } catch (err) {
    console.error(`Server not reachable at ${baseURL}: ${err?.message || err}`);
    process.exit(1);
  }

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

  const auth = await ensureAuth(page);

  console.log("Baseline: goto /dashboard, measure opacity...");
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await dismissCookieConsent(page);
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 25_000 });
  await page.waitForTimeout(300);
  const baseline = await takeOpacitySnapshot(page);
  const baselineMotionAnim = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[class*="motion-page-enter"]'));
    return nodes.map((el) => {
      const style = getComputedStyle(el);
      return {
        className:
          typeof el.className === "string" ? el.className.slice(0, 200) : null,
        opacity: parseFloat(style.opacity),
        clientHeight: el.clientHeight,
        animationName: style.animationName,
        animationPlayState: style.animationPlayState,
        animationFillMode: style.animationFillMode,
        animationDuration: style.animationDuration,
      };
    });
  });

  const navigations = [];
  for (const target of NAV_TARGETS) {
    // Ensure we start from dashboard before each nav (except chain from current)
    // User asked: Click Clients, then Settings, Sales, Dashboard — sequential from current.
    console.log(`Nav click: ${target.label}...`);
    const run = await sampleAfterClick(page, target.nameRe);
    const analysis = analyzeNav(run);
    navigations.push({
      target: target.label,
      urlHint: target.urlHint,
      endUrl: page.url(),
      endPathname: new URL(page.url()).pathname,
      ...run,
      analysis,
    });
  }

  const anyYes = navigations.some((n) => n.analysis.yesLowOpacityLargeHeight);
  const anyHiddenTall = navigations.some(
    (n) => (n.hiddenTallAt500ms?.offenderCount ?? 0) > 0
  );

  const verdict = {
    criticalQuestion:
      "YES if any settled (>400ms) post-nav state has motion-page-enter or main content wrapper at opacity < 0.1 with large height",
    answer: anyYes ? "YES" : "NO",
    anyHiddenTallInsideMainAfter500ms: anyHiddenTall,
    perNav: navigations.map((n) => ({
      target: n.target,
      endPathname: n.endPathname,
      yes: n.analysis.yesLowOpacityLargeHeight,
      yesFlags: n.analysis.yesFlags,
      hiddenTallOffenderCount: n.analysis.hiddenTallOffenderCount,
      opacityTimeline: n.analysis.opacityTimeline,
      motionAnimationCheck: n.motionAnimationCheck,
    })),
  };

  const report = {
    generatedAt: new Date().toISOString(),
    baseURL,
    viewport: { width: 1660, height: 900 },
    colorScheme: "dark",
    auth,
    sampleOffsetsMs: SAMPLE_OFFSETS_MS,
    baseline: {
      ...baseline,
      motionAnimationCheck: baselineMotionAnim,
    },
    navigations,
    verdict,
  };

  writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log("");
  console.log("=== opacity-forensics summary ===");
  console.log(`Wrote: ${outFile}`);
  console.log(`Critical: ${verdict.criticalQuestion}`);
  console.log(verdict.answer);
  console.log(`Hidden tall (opacity 0, height>400) after 500ms: ${anyHiddenTall ? "YES" : "NO"}`);
  for (const row of verdict.perNav) {
    console.log(
      `  ${row.target} -> ${row.endPathname}: ${row.yes ? "YES" : "NO"}` +
        ` (hiddenTall=${row.hiddenTallOffenderCount})`
    );
    const last = row.opacityTimeline?.[row.opacityTimeline.length - 1];
    if (last) {
      console.log(
        `    @${last.offsetMs}ms main=${last.mainOpacity} wrap=${last.pageTransitionOpacity} motion=${JSON.stringify(last.motionOpacities)} anim=${JSON.stringify(last.motionAnim)}`
      );
    }
  }

  await browser.close();
  // Print YES/NO alone-ish for parent parsers — already printed verdict.answer above
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

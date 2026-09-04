/**
 * Prefetch + soft-nav scroll forensics: does #main-content retain tall scrollTop
 * across sidebar navigations after Next.js link prefetch?
 *
 * Run: node scripts/auth-nav-prefetch-scroll-forensics.mjs
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
const outFile = resolve(outDir, "prefetch-scroll-forensics.json");

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

async function prefetchPrimaryNav(page) {
  const nav = page.locator('nav[aria-label="Primary"]');
  await nav.waitFor({ state: "visible", timeout: 15_000 });
  const links = nav.getByRole("link");
  const count = await links.count();
  const hovered = [];
  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    const href = await link.getAttribute("href").catch(() => null);
    const text = (await link.innerText().catch(() => "")).trim().slice(0, 80);
    await link.hover({ timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(400);
    hovered.push({ href, text });
  }
  await page.waitForTimeout(2000);
  return { linkCount: count, hovered };
}

async function setMainScroll(page, target = 600) {
  return page.evaluate((targetScroll) => {
    const main = document.querySelector("#main-content");
    if (!main) return { ok: false, reason: "no #main-content" };
    const max = Math.max(0, main.scrollHeight - main.clientHeight);
    const want = Math.min(targetScroll, max > 0 ? max : targetScroll);
    main.scrollTop = want;
    void main.offsetHeight;
    if (main.scrollTop < 40 && max > 200) {
      main.scrollTop = Math.min(targetScroll, max);
    }
    return {
      ok: true,
      applied: main.scrollTop,
      wanted: want,
      max,
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
      tallEnough: main.scrollHeight > main.clientHeight + 200,
    };
  }, target);
}

async function sampleRafFrames(page, frameCount = 60) {
  return page.evaluate(async (n) => {
    const samples = [];
    const take = () => {
      const main = document.querySelector("#main-content");
      samples.push({
        t: performance.now(),
        url: location.pathname,
        scrollTop: main?.scrollTop ?? null,
        scrollHeight: main?.scrollHeight ?? null,
        clientHeight: main?.clientHeight ?? null,
      });
    };
    take();
    await new Promise((resolve) => {
      let i = 1;
      const tick = () => {
        take();
        i += 1;
        if (i >= n) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return samples;
  }, frameCount);
}

async function sampleIntervalMs(page, durationMs = 1000, intervalMs = 16) {
  return page.evaluate(
    async ({ durationMs, intervalMs }) => {
      const samples = [];
      const t0 = performance.now();
      const take = () => {
        const main = document.querySelector("#main-content");
        samples.push({
          t: performance.now(),
          url: location.pathname,
          scrollTop: main?.scrollTop ?? null,
          scrollHeight: main?.scrollHeight ?? null,
          clientHeight: main?.clientHeight ?? null,
        });
      };
      take();
      await new Promise((resolve) => {
        const id = setInterval(() => {
          take();
          if (performance.now() - t0 >= durationMs) {
            clearInterval(id);
            resolve();
          }
        }, intervalMs);
      });
      return samples;
    },
    { durationMs, intervalMs }
  );
}

function analyzeSamples(samples, startUrl) {
  const list = Array.isArray(samples) ? samples : [];
  const afterUrlChange = list.filter(
    (s) => typeof s.url === "string" && s.url !== startUrl
  );
  const retainedTallFrames = afterUrlChange.filter(
    (s) =>
      typeof s.scrollTop === "number" &&
      s.scrollTop > 40 &&
      typeof s.scrollHeight === "number" &&
      typeof s.clientHeight === "number" &&
      s.scrollHeight > s.clientHeight + 200
  );
  const maxScrollTopAfterUrlChange = afterUrlChange.reduce((m, s) => {
    if (typeof s.scrollTop !== "number") return m;
    return Math.max(m, s.scrollTop);
  }, 0);
  return {
    sampleCount: list.length,
    afterUrlChangeCount: afterUrlChange.length,
    firstUrl: list[0]?.url ?? null,
    lastUrl: list.length ? list[list.length - 1].url : null,
    startUrl,
    anyRetainedTallScrollWithoutClamp: retainedTallFrames.length > 0,
    retainedTallFrameCount: retainedTallFrames.length,
    firstRetainedTallFrame: retainedTallFrames[0] ?? null,
    maxScrollTopAfterUrlChange,
    firstAfterUrlChange: afterUrlChange[0] ?? null,
    lastSample: list.length ? list[list.length - 1] : null,
  };
}

async function clickSidebarLink(page, nameRe) {
  const nav = page.locator('nav[aria-label="Primary"]');
  await nav.getByRole("link", { name: nameRe }).first().click({ noWaitAfter: true });
}

async function scenarioPrefetchThenSettings(page) {
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await dismissCookieConsent(page);
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 25_000 });
  await page.waitForTimeout(300);

  const prefetch = await prefetchPrimaryNav(page);
  const startUrl = new URL(page.url()).pathname;
  const scrollApply = await setMainScroll(page, 600);
  const before = await page.evaluate(() => {
    const main = document.querySelector("#main-content");
    return {
      t: performance.now(),
      url: location.pathname,
      scrollTop: main?.scrollTop ?? null,
      scrollHeight: main?.scrollHeight ?? null,
      clientHeight: main?.clientHeight ?? null,
    };
  });

  await clickSidebarLink(page, /^Settings\b/i);

  const rafSamples = await sampleRafFrames(page, 60);
  const intervalSamples = await sampleIntervalMs(page, 1000, 16);

  await page.waitForURL("**/settings**", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(100);

  const combined = [...rafSamples, ...intervalSamples];
  const analysis = analyzeSamples(combined, startUrl);

  return {
    label: "prefetch-hover-all -> scroll 600 -> Settings (rAF60 + interval1s)",
    startUrl,
    endUrl: new URL(page.url()).pathname,
    prefetch,
    scrollApply,
    before,
    rafSamples,
    intervalSamples,
    analysis,
  };
}

async function scenarioInstantPollOnClick(page) {
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await dismissCookieConsent(page);
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 25_000 });
  await page.waitForTimeout(200);

  const prefetch = await prefetchPrimaryNav(page);
  const startUrl = new URL(page.url()).pathname;
  const scrollApply = await setMainScroll(page, 600);

  await page.evaluate(() => {
    window.__prefetchScrollSamples = [];
    window.__prefetchScrollPolling = false;
    const take = () => {
      const main = document.querySelector("#main-content");
      window.__prefetchScrollSamples.push({
        t: performance.now(),
        url: location.pathname,
        scrollTop: main?.scrollTop ?? null,
        scrollHeight: main?.scrollHeight ?? null,
        clientHeight: main?.clientHeight ?? null,
      });
    };
    const startPoll = () => {
      if (window.__prefetchScrollPolling) return;
      window.__prefetchScrollPolling = true;
      take();
      const t0 = performance.now();
      const tick = () => {
        take();
        if (performance.now() - t0 < 1000) {
          requestAnimationFrame(tick);
        } else {
          window.__prefetchScrollPolling = false;
        }
      };
      requestAnimationFrame(tick);
    };
    document.addEventListener(
      "click",
      (ev) => {
        const a = ev.target?.closest?.("a");
        if (!a) return;
        const nav = a.closest('nav[aria-label="Primary"]');
        if (!nav) return;
        take();
        startPoll();
      },
      true
    );
  });

  const clickAndPoll = await page.evaluate(async () => {
    const nav = document.querySelector('nav[aria-label="Primary"]');
    const links = Array.from(nav?.querySelectorAll("a") ?? []);
    const settings = links.find((a) => /^Settings\b/i.test((a.textContent || "").trim()));
    if (!settings) return { ok: false, reason: "Settings link not found", samples: [] };

    const samples = [];
    const take = () => {
      const main = document.querySelector("#main-content");
      samples.push({
        t: performance.now(),
        url: location.pathname,
        scrollTop: main?.scrollTop ?? null,
        scrollHeight: main?.scrollHeight ?? null,
        clientHeight: main?.clientHeight ?? null,
      });
    };

    const localStart = location.pathname;
    take();
    settings.click();
    take();

    const t0 = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        take();
        if (performance.now() - t0 >= 1000 || samples.length >= 90) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    return { ok: true, startUrl: localStart, samples };
  });

  await page.waitForURL("**/settings**", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(50);

  const listenerSamples = await page.evaluate(() => window.__prefetchScrollSamples ?? []);
  const analysisClickEval = analyzeSamples(clickAndPoll.samples ?? [], startUrl);
  const analysisListener = analyzeSamples(listenerSamples, startUrl);

  return {
    label: "prefetch -> scroll 600 -> evaluate(settings.click)+instant rAF poll",
    startUrl,
    endUrl: new URL(page.url()).pathname,
    prefetch: { linkCount: prefetch.linkCount },
    scrollApply,
    clickAndPoll: {
      ok: clickAndPoll.ok,
      reason: clickAndPoll.reason ?? null,
      sampleCount: clickAndPoll.samples?.length ?? 0,
      analysis: analysisClickEval,
      samples: clickAndPoll.samples ?? [],
    },
    capturePhaseListener: {
      sampleCount: listenerSamples.length,
      analysis: analysisListener,
      samples: listenerSamples,
    },
  };
}

async function scenarioPrefetchThenClients(page) {
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await dismissCookieConsent(page);
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 25_000 });
  await page.waitForTimeout(200);

  const prefetch = await prefetchPrimaryNav(page);
  const clientsHref = prefetch.hovered.find((h) =>
    (h.href || "").includes("/clients")
  )?.href;
  let requestWarm = null;
  if (clientsHref) {
    const url = clientsHref.startsWith("http")
      ? clientsHref
      : `${baseURL}${clientsHref.startsWith("/") ? "" : "/"}${clientsHref}`;
    try {
      const res = await page.request.get(url);
      requestWarm = { url, status: res.status() };
    } catch (err) {
      requestWarm = { url, error: String(err?.message || err) };
    }
  }

  const startUrl = new URL(page.url()).pathname;
  const scrollApply = await setMainScroll(page, 600);
  const before = await page.evaluate(() => {
    const main = document.querySelector("#main-content");
    return {
      t: performance.now(),
      url: location.pathname,
      scrollTop: main?.scrollTop ?? null,
      scrollHeight: main?.scrollHeight ?? null,
      clientHeight: main?.clientHeight ?? null,
    };
  });

  const clickAndPoll = await page.evaluate(async () => {
    const nav = document.querySelector('nav[aria-label="Primary"]');
    const links = Array.from(nav?.querySelectorAll("a") ?? []);
    const clients = links.find((a) => /^Clients\b/i.test((a.textContent || "").trim()));
    if (!clients) return { ok: false, reason: "Clients link not found", samples: [] };

    const samples = [];
    const take = () => {
      const main = document.querySelector("#main-content");
      samples.push({
        t: performance.now(),
        url: location.pathname,
        scrollTop: main?.scrollTop ?? null,
        scrollHeight: main?.scrollHeight ?? null,
        clientHeight: main?.clientHeight ?? null,
      });
    };
    take();
    clients.click();
    take();
    const t0 = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        take();
        if (performance.now() - t0 >= 1000 || samples.length >= 90) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return { ok: true, samples };
  });

  await page.waitForURL("**/clients**", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(50);

  const analysis = analyzeSamples(clickAndPoll.samples ?? [], startUrl);

  return {
    label: "prefetch-hover-all + request-warm -> scroll 600 -> Clients soft-nav",
    startUrl,
    endUrl: new URL(page.url()).pathname,
    prefetch,
    requestWarm,
    scrollApply,
    before,
    clickAndPoll: {
      ok: clickAndPoll.ok,
      sampleCount: clickAndPoll.samples?.length ?? 0,
      analysis,
      samples: clickAndPoll.samples ?? [],
    },
  };
}

async function scenarioPrefetchThenSales(page) {
  await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
  await dismissCookieConsent(page);
  await page.locator("#main-content").waitFor({ state: "visible", timeout: 25_000 });
  await page.waitForTimeout(200);

  const prefetch = await prefetchPrimaryNav(page);
  const startUrl = new URL(page.url()).pathname;
  const scrollApply = await setMainScroll(page, 600);

  const clickAndPoll = await page.evaluate(async () => {
    const nav = document.querySelector('nav[aria-label="Primary"]');
    const links = Array.from(nav?.querySelectorAll("a") ?? []);
    const sales = links.find((a) => /^Sales\b/i.test((a.textContent || "").trim()));
    if (!sales) return { ok: false, reason: "Sales link not found", samples: [] };

    const samples = [];
    const take = () => {
      const main = document.querySelector("#main-content");
      samples.push({
        t: performance.now(),
        url: location.pathname,
        scrollTop: main?.scrollTop ?? null,
        scrollHeight: main?.scrollHeight ?? null,
        clientHeight: main?.clientHeight ?? null,
      });
    };
    take();
    sales.click();
    take();
    const t0 = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        take();
        if (performance.now() - t0 >= 1000 || samples.length >= 90) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return { ok: true, samples };
  });

  await page.waitForURL("**/sales**", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(50);

  const analysis = analyzeSamples(clickAndPoll.samples ?? [], startUrl);

  return {
    label: "prefetch-hover-all -> scroll 600 -> Sales (tall page)",
    startUrl,
    endUrl: new URL(page.url()).pathname,
    prefetch: { linkCount: prefetch.linkCount },
    scrollApply,
    clickAndPoll: {
      ok: clickAndPoll.ok,
      sampleCount: clickAndPoll.samples?.length ?? 0,
      analysis,
      samples: clickAndPoll.samples ?? [],
    },
  };
}

function collectVerdict(scenarios) {
  const flags = [];
  const push = (path, analysis) => {
    if (!analysis) return;
    flags.push({
      path,
      anyRetainedTallScrollWithoutClamp: Boolean(
        analysis.anyRetainedTallScrollWithoutClamp
      ),
      retainedTallFrameCount: analysis.retainedTallFrameCount ?? 0,
      maxScrollTopAfterUrlChange: analysis.maxScrollTopAfterUrlChange ?? null,
      firstRetainedTallFrame: analysis.firstRetainedTallFrame ?? null,
    });
  };

  push("A.settings.raf+interval", scenarios.prefetchSettings?.analysis);
  push("B.settings.clickEval", scenarios.instantPoll?.clickAndPoll?.analysis);
  push("B.settings.listener", scenarios.instantPoll?.capturePhaseListener?.analysis);
  push("C.clients", scenarios.prefetchClients?.clickAndPoll?.analysis);
  push("D.sales", scenarios.prefetchSales?.clickAndPoll?.analysis);

  const yes = flags.some((f) => f.anyRetainedTallScrollWithoutClamp);
  return {
    criticalQuestion:
      "Is there ANY frame after URL change where scrollTop>40 AND scrollHeight > clientHeight+200?",
    answer: yes ? "YES" : "NO",
    retainedTallScrollWithoutClamp: yes,
    perScenario: flags,
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

  console.log("Running scenario A: prefetch -> Settings (rAF + interval)...");
  const prefetchSettings = await scenarioPrefetchThenSettings(page);

  console.log("Running scenario B: instant poll on evaluate(click)...");
  const instantPoll = await scenarioInstantPollOnClick(page);

  console.log("Running scenario C: prefetch -> Clients soft-nav...");
  const prefetchClients = await scenarioPrefetchThenClients(page);

  console.log("Running scenario D: prefetch -> Sales...");
  const prefetchSales = await scenarioPrefetchThenSales(page);

  const scenarios = {
    prefetchSettings,
    instantPoll,
    prefetchClients,
    prefetchSales,
  };
  const verdict = collectVerdict(scenarios);

  const report = {
    generatedAt: new Date().toISOString(),
    baseURL,
    viewport: { width: 1660, height: 900 },
    colorScheme: "dark",
    auth,
    buildNote:
      "UNFIXED build assumed (server on :3005). Prefetch hover + soft-nav scroll retention probe.",
    scenarios,
    verdict,
  };

  writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log("");
  console.log("=== prefetch-scroll-forensics summary ===");
  console.log(`Wrote: ${outFile}`);
  console.log(`Critical question: ${verdict.criticalQuestion}`);
  console.log(`ANSWER: ${verdict.answer}`);
  console.log(
    `Retained tall scroll without clamp (scrollTop>40 && scrollHeight>clientHeight+200 after URL change): ${verdict.answer}`
  );
  for (const row of verdict.perScenario) {
    console.log(
      `  ${row.path}: ${row.anyRetainedTallScrollWithoutClamp ? "YES" : "NO"}` +
        ` (frames=${row.retainedTallFrameCount}, maxScrollTopAfterUrl=${row.maxScrollTopAfterUrlChange})`
    );
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
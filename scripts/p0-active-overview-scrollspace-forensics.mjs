/**
 * P0 active Overview scrollspace forensics.
 * Maps full dashboard vertical geometry + Overview top-level breakdown + blank-pixel owners.
 * Usage:
 *   $env:BASE_URL="https://www.auroranexis.com"; node scripts/p0-active-overview-scrollspace-forensics.mjs
 *   $env:BASE_URL="http://127.0.0.1:3005"; node scripts/p0-active-overview-scrollspace-forensics.mjs
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
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|clients|\/app/, { timeout: 90_000 }).catch(() => null);
}

async function settle(page) {
  await page.waitForFunction(
    () => {
      const main = document.querySelector("#main-content");
      if (!main) return false;
      const t = main.innerText || "";
      return (
        !t.includes("Loading content") &&
        Boolean(main.querySelector("[data-operations-center], section[aria-label='Operations']"))
      );
    },
    null,
    { timeout: 90_000 },
  );
  await page.waitForTimeout(600);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: vw, height: vh } });

if (!email || !password) {
  console.error("Missing E2E credentials");
  process.exit(1);
}

await login(page);
await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 90_000 });
await settle(page);

const report = await page.evaluate(() => {
  const main = document.querySelector("#main-content");
  if (!main) return { error: "no #main-content" };

  const mainRect = main.getBoundingClientRect();
  const absTop = (el) => {
    const r = el.getBoundingClientRect();
    return Math.round(r.top - mainRect.top + main.scrollTop);
  };
  const absBottom = (el) => {
    const r = el.getBoundingClientRect();
    return Math.round(r.bottom - mainRect.top + main.scrollTop);
  };
  const cs = (el) => {
    const s = getComputedStyle(el);
    return {
      display: s.display,
      position: s.position,
      height: s.height,
      minHeight: s.minHeight,
      maxHeight: s.maxHeight,
      marginTop: s.marginTop,
      marginBottom: s.marginBottom,
      paddingTop: s.paddingTop,
      paddingBottom: s.paddingBottom,
      overflow: s.overflow,
      overflowY: s.overflowY,
      alignItems: s.alignItems,
      gridAutoRows: s.gridAutoRows,
      rowGap: s.rowGap,
      gap: s.gap,
    };
  };

  const describe = (el, extra = {}) => {
    const r = el.getBoundingClientRect();
    const heading =
      el.querySelector("h1,h2,h3,[data-slot='title']")?.textContent?.trim()?.slice(0, 80) ||
      el.getAttribute("aria-label") ||
      null;
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      className: (el.className && String(el.className).slice(0, 160)) || "",
      aria: el.getAttribute("aria-label"),
      dataAttrs: [...el.attributes]
        .filter((a) => a.name.startsWith("data-"))
        .map((a) => `${a.name}=${a.value}`)
        .slice(0, 12),
      heading,
      top: absTop(el),
      bottom: absBottom(el),
      offsetHeight: el.offsetHeight,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      childCount: el.childElementCount,
      visible: r.height > 0 && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden",
      styles: cs(el),
      textPreview: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 100),
      meaningful:
        (el.innerText || "").replace(/\s+/g, " ").trim().length > 20 ||
        el.querySelector("img,svg,canvas,table,ul,ol,button,a,input") != null,
      ...extra,
    };
  };

  const motion = main.querySelector('[class*="motion-page"]');
  const pageRoot =
    motion?.querySelector(":scope > div.space-y-6, :scope > div.space-y-8") ||
    motion?.firstElementChild ||
    null;

  // Direct vertical children of dashboard page root
  const pageChildren = pageRoot
    ? [...pageRoot.children].map((el, i) => describe(el, { index: i }))
    : [];

  const opsCenter = main.querySelector("[data-operations-center]");
  const activePanel = opsCenter?.querySelector('[role="tabpanel"]:not([hidden])');
  const allPanels = opsCenter
    ? [...opsCenter.querySelectorAll('[role="tabpanel"]')].map((el) =>
        describe(el, {
          tab: el.getAttribute("data-operations-tab"),
          active: el.getAttribute("data-operations-tab-active"),
          hiddenAttr: el.hasAttribute("hidden"),
        }),
      )
    : [];

  // Overview hierarchy: active panel → grid → top-level section blocks
  let overviewBreakdown = null;
  if (activePanel) {
    const grid = activePanel.firstElementChild;
    const gridChildren = grid
      ? [...grid.children].map((el, i) => {
          const panel = el.querySelector("[class*='rounded'], section, article") || el;
          return describe(el, {
            index: i,
            colSpan: el.className,
            innerHeading:
              el.querySelector("h2,h3")?.textContent?.trim()?.slice(0, 80) || null,
            innerOffsetHeight: panel.offsetHeight,
            nestedTall: [...el.querySelectorAll("*")]
              .filter((n) => n.offsetHeight > 250)
              .slice(0, 12)
              .map((n) => ({
                tag: n.tagName.toLowerCase(),
                className: String(n.className || "").slice(0, 100),
                h: n.offsetHeight,
                heading: n.querySelector("h2,h3")?.textContent?.trim()?.slice(0, 60) || null,
              })),
          });
        })
      : [];

    const tallDescendants = [...activePanel.querySelectorAll("*")]
      .filter((n) => n.offsetHeight > 250)
      .map((n) => ({
        tag: n.tagName.toLowerCase(),
        className: String(n.className || "").slice(0, 120),
        h: n.offsetHeight,
        top: absTop(n),
        bottom: absBottom(n),
        heading: n.querySelector("h2,h3")?.textContent?.trim()?.slice(0, 60) || null,
        parentHeading:
          n.parentElement?.closest("[class*='rounded']")?.querySelector("h2,h3")?.textContent?.trim()?.slice(0, 60) ||
          null,
      }))
      .sort((a, b) => b.h - a.h);

    overviewBreakdown = {
      panel: describe(activePanel),
      grid: grid ? describe(grid) : null,
      topLevelBlocks: gridChildren,
      tallDescendantsCount: tallDescendants.length,
      tallDescendants: tallDescendants.slice(0, 30),
      mountMode: opsCenter?.getAttribute("data-ops-mount") || null,
    };
  }

  // Sections map
  const sections = [...main.querySelectorAll("section[aria-label]")].map((el) => describe(el));

  const footer = main.querySelector("footer");
  const footerDesc = footer ? describe(footer) : null;

  // Visual-end vs DOM-end: sample blank region elementFromPoint
  const clientH = main.clientHeight;
  const maxScroll = Math.max(0, main.scrollHeight - clientH);
  const blankSamples = [];
  const sampleTops = [
    Math.round(maxScroll * 0.55),
    Math.round(maxScroll * 0.7),
    Math.round(maxScroll * 0.85),
    Math.round(maxScroll * 0.95),
    maxScroll,
  ];

  const originalScroll = main.scrollTop;
  for (const st of sampleTops) {
    main.scrollTop = st;
    // force layout
    void main.offsetHeight;
    const cx = Math.round(window.innerWidth / 2);
    const cy = Math.round(mainRect.top + clientH / 2);
    const hit = document.elementFromPoint(cx, cy);
    const chain = [];
    let n = hit;
    while (n && n !== document.documentElement && chain.length < 14) {
      chain.push({
        tag: n.tagName?.toLowerCase(),
        id: n.id || null,
        className: String(n.className || "").slice(0, 100),
        aria: n.getAttribute?.("aria-label") || null,
        h: n.offsetHeight,
      });
      n = n.parentElement;
    }
    blankSamples.push({
      scrollTop: st,
      hitTag: hit?.tagName?.toLowerCase() || null,
      hitClass: String(hit?.className || "").slice(0, 120),
      hitId: hit?.id || null,
      hitText: (hit?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80),
      chain,
    });
  }
  main.scrollTop = originalScroll;

  // Gaps between consecutive page children > 500px of "empty" viewport potential
  const gaps = [];
  for (let i = 0; i < pageChildren.length - 1; i++) {
    const a = pageChildren[i];
    const b = pageChildren[i + 1];
    const gap = b.top - a.bottom;
    if (gap > 40) {
      gaps.push({ afterIndex: i, afterHeading: a.heading || a.aria, beforeHeading: b.heading || b.aria, gap });
    }
  }

  const lastContentBottom = Math.max(
    footerDesc?.bottom || 0,
    pageChildren.length ? pageChildren[pageChildren.length - 1].bottom : 0,
    sections.length ? Math.max(...sections.map((s) => s.bottom)) : 0,
  );

  // In-row stretch waste inside Overview grid
  let rowStretchWaste = [];
  if (activePanel?.firstElementChild) {
    const grid = activePanel.firstElementChild;
    const kids = [...grid.children];
    // group by approximate top
    const rows = [];
    for (const kid of kids) {
      const t = absTop(kid);
      let row = rows.find((r) => Math.abs(r.top - t) < 8);
      if (!row) {
        row = { top: t, items: [] };
        rows.push(row);
      }
      row.items.push(kid);
    }
    rowStretchWaste = rows.map((row) => {
      const heights = row.items.map((el) => el.offsetHeight);
      const maxH = Math.max(...heights, 0);
      const minH = Math.min(...heights, maxH);
      return {
        top: row.top,
        count: row.items.length,
        maxH,
        minH,
        wasteUnderShortest: maxH - minH,
        headings: row.items.map(
          (el) => el.querySelector("h2,h3")?.textContent?.trim()?.slice(0, 40) || "?",
        ),
      };
    });
  }

  return {
    url: location.href,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    main: {
      clientHeight: main.clientHeight,
      scrollHeight: main.scrollHeight,
      scrollTop: main.scrollTop,
      paddingBottom: getComputedStyle(main).paddingBottom,
      styles: cs(main),
    },
    motion: motion ? describe(motion) : null,
    pageRoot: pageRoot ? describe(pageRoot) : null,
    pageChildren,
    sections,
    opsPanels: allPanels,
    overviewBreakdown,
    rowStretchWaste,
    footer: footerDesc,
    lastContentBottom,
    unexplainedExcess: main.scrollHeight - lastContentBottom,
    gaps,
    blankSamples,
    buildHint: {
      opsMount: opsCenter?.getAttribute("data-ops-mount"),
      hasOpsCenter: Boolean(opsCenter),
      detailsOpen: [...main.querySelectorAll("details")].map((d) => ({
        summary: d.querySelector("summary")?.textContent?.trim()?.slice(0, 60),
        open: d.open,
        h: d.offsetHeight,
      })),
    },
  };
});

const host = new URL(baseURL).host.replace(/[^\w.-]+/g, "_");
const outPath = resolve(outDir, `p0-active-overview-forensics-${host}-${vw}x${vh}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));

const summary = {
  url: report.url,
  SH: report.main?.scrollHeight,
  CH: report.main?.clientHeight,
  overviewH: report.overviewBreakdown?.panel?.offsetHeight,
  overviewBlocks: report.overviewBreakdown?.topLevelBlocks?.map((b) => ({
    h: b.offsetHeight,
    heading: b.innerHeading,
    top: b.top,
    bottom: b.bottom,
  })),
  pageChildren: report.pageChildren?.map((c) => ({
    h: c.offsetHeight,
    top: c.top,
    bottom: c.bottom,
    heading: c.heading || c.aria,
  })),
  opsPanels: report.opsPanels?.map((p) => ({
    tab: p.tab,
    h: p.offsetHeight,
    kids: p.childCount,
    hidden: p.hiddenAttr,
    display: p.styles?.display,
  })),
  rowStretchWaste: report.rowStretchWaste,
  footerBottom: report.footer?.bottom,
  unexplainedExcess: report.unexplainedExcess,
  blankHitAt85: report.blankSamples?.find((s) => s.scrollTop >= (report.main?.scrollHeight - report.main?.clientHeight) * 0.85),
  details: report.buildHint?.detailsOpen,
  mount: report.buildHint?.opsMount,
};
console.log(JSON.stringify(summary, null, 2));
console.log(`Wrote ${outPath}`);
await browser.close();

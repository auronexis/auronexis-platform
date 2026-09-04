import { expect, test, type Page } from "@playwright/test";
import { hasE2ECredentials } from "./helpers/auth";

/**
 * P0: remaining dashboard scrollspace after inactive-tab unmount.
 * Defect: lg-only ops/exec grids single-stacked Overview (~2413) and inflated
 * #main-content (~6358–6820) below the lg breakpoint / mid widths.
 */

const DESKTOP = { width: 1660, height: 900 };
const MID = { width: 1000, height: 900 };

/** Operator broken band was Overview≈2521 / main≈6820 (sub-lg stack ± variance). */
const DESKTOP_SCROLL_CEILING = 4500;
const DESKTOP_OVERVIEW_CEILING = 1400;
const MID_SCROLL_CEILING = 5200;
const MID_OVERVIEW_CEILING = 1800;
const MAX_SECTION_GAP = 500;
const MAX_EXCESS_AFTER_FOOTER = 96;

async function waitForDashboard(page: Page) {
  await page.goto("/dashboard");
  await page.waitForURL(/\/dashboard/, { timeout: 45_000 });
  await page.waitForFunction(
    () => {
      const main = document.querySelector("#main-content") as HTMLElement | null;
      if (!main) return false;
      const text = main.innerText || "";
      return (
        !text.includes("Loading content") &&
        Boolean(main.querySelector("[data-operations-center]"))
      );
    },
    null,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(400);
}

type Geometry = {
  clientHeight: number;
  scrollHeight: number;
  overviewHeight: number;
  overviewChildCount: number;
  inactiveTabs: Array<{ tab: string | null; offsetHeight: number; childCount: number; display: string }>;
  footerBottom: number;
  unexplainedExcess: number;
  sectionGaps: Array<{ after: string | null; before: string | null; gap: number }>;
  maxSectionGap: number;
  blankAtMaxScroll: {
    scrollTop: number;
    hitId: string | null;
    hitClass: string;
    hitTag: string | null;
    nearFooter: boolean;
    isMainBackgroundOnly: boolean;
  };
  lg: boolean;
  contentWidth: number;
};

async function measureGeometry(page: Page): Promise<Geometry> {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content") as HTMLElement | null;
    if (!main) throw new Error("missing #main-content");
    const mainRect = main.getBoundingClientRect();
    const absBottom = (el: Element) => {
      const r = el.getBoundingClientRect();
      return Math.round(r.bottom - mainRect.top + main.scrollTop);
    };
    const absTop = (el: Element) => {
      const r = el.getBoundingClientRect();
      return Math.round(r.top - mainRect.top + main.scrollTop);
    };

    const active = main.querySelector(
      "[data-operations-center] [role='tabpanel']:not([hidden])",
    ) as HTMLElement | null;
    const inactive = [...main.querySelectorAll("[data-operations-center] [role='tabpanel']")]
      .filter((el) => el.getAttribute("data-operations-tab-active") !== "true")
      .map((el) => ({
        tab: el.getAttribute("data-operations-tab"),
        offsetHeight: (el as HTMLElement).offsetHeight,
        childCount: el.childElementCount,
        display: getComputedStyle(el).display,
      }));

    const footer = main.querySelector("footer");
    const footerBottom = footer ? absBottom(footer) : 0;

    const sections = [...main.querySelectorAll("section[aria-label]")].filter((el) => {
      const aria = el.getAttribute("aria-label") || "";
      return [
        "Operations Command Center overview",
        "Executive intelligence",
        "Workspace pulse",
        "Workspace guidance",
        "Operations",
      ].includes(aria) || aria === "Get started";
    });

    const sectionGaps: Geometry["sectionGaps"] = [];
    for (let i = 0; i < sections.length - 1; i++) {
      const a = sections[i]!;
      const b = sections[i + 1]!;
      const gap = absTop(b) - absBottom(a);
      sectionGaps.push({
        after: a.getAttribute("aria-label"),
        before: b.getAttribute("aria-label"),
        gap,
      });
    }

    const maxScroll = Math.max(0, main.scrollHeight - main.clientHeight);
    main.scrollTop = maxScroll;
    void main.offsetHeight;
    const cx = Math.round(window.innerWidth / 2);
    const cy = Math.round(mainRect.top + main.clientHeight / 2);
    const hit = document.elementFromPoint(cx, cy);
    const hitClass = String(hit?.className || "");
    const nearFooter = Boolean(
      hit?.closest("footer") ||
        (footer &&
          Math.abs(absBottom(footer) - (main.scrollTop + main.clientHeight)) < 200),
    );
    const isMainBackgroundOnly =
      hit === main ||
      (hit?.id === "main-content" && !(hit.textContent || "").trim()) ||
      (hitClass.includes("dashboard-main") && !hit?.closest("footer, [data-operations-center], section"));

    const motion = main.querySelector("[class*='motion-page']") as HTMLElement | null;

    return {
      clientHeight: main.clientHeight,
      scrollHeight: main.scrollHeight,
      overviewHeight: active?.offsetHeight ?? 0,
      overviewChildCount: active?.childElementCount ?? 0,
      inactiveTabs: inactive,
      footerBottom,
      unexplainedExcess: main.scrollHeight - footerBottom,
      sectionGaps,
      maxSectionGap: sectionGaps.reduce((n, g) => Math.max(n, g.gap), 0),
      blankAtMaxScroll: {
        scrollTop: main.scrollTop,
        hitId: hit?.id || null,
        hitClass: hitClass.slice(0, 120),
        hitTag: hit?.tagName?.toLowerCase() || null,
        nearFooter,
        isMainBackgroundOnly,
      },
      lg: matchMedia("(min-width: 1024px)").matches,
      contentWidth: Math.round(motion?.getBoundingClientRect().width ?? 0),
    };
  });
}

test.describe("P0 active Overview scrollspace", () => {
  test.skip(!hasE2ECredentials(), "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD for authenticated flows.");

  test("desktop 1660: Overview content-bound; inactive tabs unmounted; footer closes scroll", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(DESKTOP);
    await waitForDashboard(page);
    const geo = await measureGeometry(page);
    await testInfo.attach("desktop-1660-geometry", {
      body: JSON.stringify(geo, null, 2),
      contentType: "application/json",
    });

    expect(geo.overviewChildCount, "active Overview mounts a single content root").toBe(1);
    expect(geo.overviewHeight).toBeLessThanOrEqual(DESKTOP_OVERVIEW_CEILING);
    expect(geo.scrollHeight).toBeLessThanOrEqual(DESKTOP_SCROLL_CEILING);
    expect(geo.unexplainedExcess).toBeLessThanOrEqual(MAX_EXCESS_AFTER_FOOTER);
    expect(geo.maxSectionGap).toBeLessThanOrEqual(MAX_SECTION_GAP);
    expect(geo.blankAtMaxScroll.isMainBackgroundOnly).toBe(false);
    expect(geo.blankAtMaxScroll.nearFooter).toBe(true);

    for (const tab of geo.inactiveTabs) {
      expect(tab.offsetHeight, `inactive ${tab.tab}`).toBe(0);
      expect(tab.childCount, `inactive ${tab.tab} must not mount content`).toBe(0);
      expect(tab.display).toBe("none");
    }
  });

  test("mid 1000: must not single-stack Overview to ~2521 / main ~6820", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(MID);
    await waitForDashboard(page);
    const geo = await measureGeometry(page);
    await testInfo.attach("mid-1000-geometry", {
      body: JSON.stringify(geo, null, 2),
      contentType: "application/json",
    });

    // This is the remaining defect band after inactive-tab unmount.
    expect(
      geo.overviewHeight,
      `Overview ${geo.overviewHeight}px must stay well below operator ~2521 single-stack`,
    ).toBeLessThanOrEqual(MID_OVERVIEW_CEILING);
    expect(
      geo.scrollHeight,
      `main SH ${geo.scrollHeight} must stay well below operator ~6820`,
    ).toBeLessThanOrEqual(MID_SCROLL_CEILING);
    expect(geo.unexplainedExcess).toBeLessThanOrEqual(MAX_EXCESS_AFTER_FOOTER);
    expect(geo.maxSectionGap).toBeLessThanOrEqual(MAX_SECTION_GAP);
    expect(geo.blankAtMaxScroll.isMainBackgroundOnly).toBe(false);

    for (const tab of geo.inactiveTabs) {
      expect(tab.childCount, `inactive ${tab.tab}`).toBe(0);
      expect(tab.offsetHeight).toBe(0);
    }

    // Active Overview should keep a 2-col md grid (not 6 stacked full-width rows).
    const rowCount = await page.evaluate(() => {
      const grid = document.querySelector(
        "[data-operations-tab-active='true'] > div",
      ) as HTMLElement | null;
      if (!grid) return 0;
      const tops = [...grid.children].map((el) => Math.round(el.getBoundingClientRect().top));
      return new Set(tops).size;
    });
    expect(rowCount, "Overview should pack into ~3 rows (2-col), not 6").toBeLessThanOrEqual(4);
  });
});

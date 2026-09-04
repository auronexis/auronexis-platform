import { expect, test, type Page } from "@playwright/test";
import { hasE2ECredentials } from "./helpers/auth";

const VIEWPORT = { width: 1660, height: 900 };
/** Operator P0 band was ~6820 with stacked inactive ops tabs; post-fix ceiling. */
const SCROLL_HEIGHT_CEILING = 4500;
const MOTION_HEIGHT_CEILING = 4400;

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
        Boolean(main.querySelector('[data-operations-center], section[aria-label="Operations"]'))
      );
    },
    null,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(400);
}

type MotionGeometry = {
  clientHeight: number;
  scrollHeight: number;
  motionOffsetHeight: number | null;
  motionClass: string | null;
  nestedWrapperHeight: number | null;
  welcomeVisible: boolean;
  inactiveTabHeights: Array<{ tab: string | null; offsetHeight: number; childCount: number; display: string }>;
  forcedUnhideScrollHeight: number;
  footerBottom: number;
  unexplainedAfterFooter: number;
};

async function measureMotionGeometry(page: Page): Promise<MotionGeometry> {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content") as HTMLElement | null;
    if (!main) {
      throw new Error("missing #main-content");
    }
    const mainRect = main.getBoundingClientRect();
    const motion = main.querySelector('[class*="motion-page"]') as HTMLElement | null;
    const nested = motion?.firstElementChild as HTMLElement | null;
    const footer = main.querySelector("footer");
    const footerBottom = footer
      ? Math.round(footer.getBoundingClientRect().bottom - mainRect.top + main.scrollTop)
      : 0;

    const inactive = [...main.querySelectorAll("[data-operations-center] [role='tabpanel']")]
      .filter((el) => el.getAttribute("data-operations-tab-active") !== "true")
      .map((el) => ({
        tab: el.getAttribute("data-operations-tab"),
        offsetHeight: (el as HTMLElement).offsetHeight,
        childCount: el.childElementCount,
        display: getComputedStyle(el).display,
      }));

    const naturalScrollHeight = main.scrollHeight;
    const naturalMotionHeight = motion?.offsetHeight ?? null;

    // Regression probe: even if hidden/display is stripped, inactive panels must not
    // reintroduce ~3kpx of stacked Operations content (operator SH ≈ 6820).
    const panels = [...main.querySelectorAll("[data-operations-center] [role='tabpanel']")];
    for (const panel of panels) {
      (panel as HTMLElement).hidden = false;
      (panel as HTMLElement).style.display = "block";
      (panel as HTMLElement).classList.remove("hidden");
    }
    const forcedUnhideScrollHeight = main.scrollHeight;

    return {
      clientHeight: main.clientHeight,
      scrollHeight: naturalScrollHeight,
      motionOffsetHeight: naturalMotionHeight,
      motionClass: motion?.className?.slice(0, 100) ?? null,
      nestedWrapperHeight: nested?.offsetHeight ?? null,
      welcomeVisible: /Welcome,\s+/i.test(main.innerText || ""),
      inactiveTabHeights: inactive,
      forcedUnhideScrollHeight,
      footerBottom,
      unexplainedAfterFooter: naturalScrollHeight - footerBottom,
    };
  });
}

test.describe("P0 motion-page wrapper blank space", () => {
  test.skip(!hasE2ECredentials(), "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD for authenticated flows.");

  test.use({ viewport: VIEWPORT });

  test("keeps motion wrapper height content-bound; inactive ops tabs cannot inflate scrollHeight", async ({
    page,
  }, testInfo) => {
    await waitForDashboard(page);
    const geo = await measureMotionGeometry(page);
    await testInfo.attach("motion-wrapper-geometry", {
      body: JSON.stringify(geo, null, 2),
      contentType: "application/json",
    });

    expect(geo.motionClass, "PageTransition motion-page-enter must wrap dashboard").toMatch(
      /motion-page/,
    );
    expect(geo.scrollHeight).toBeLessThanOrEqual(SCROLL_HEIGHT_CEILING);
    expect(geo.motionOffsetHeight ?? 99999).toBeLessThanOrEqual(MOTION_HEIGHT_CEILING);
    expect(geo.unexplainedAfterFooter).toBeLessThanOrEqual(96);

    for (const tab of geo.inactiveTabHeights) {
      expect(tab.offsetHeight, `inactive tab ${tab.tab} must not own layout height`).toBe(0);
      expect(tab.childCount, `inactive tab ${tab.tab} must not mount panel content`).toBe(0);
    }

    // Critical: stripping hidden must NOT resurrect operator ~6820px geometry.
    expect(
      geo.forcedUnhideScrollHeight,
      `forced-unhide SH ${geo.forcedUnhideScrollHeight} must stay near content-bound height (operator defect was ~6820)`,
    ).toBeLessThanOrEqual(SCROLL_HEIGHT_CEILING);
  });
});

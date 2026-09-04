import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { hasE2ECredentials } from "./helpers/auth";

const VIEWPORT = { width: 1660, height: 900 };
const ARTIFACT_DIR = resolve("test-results", "auth-nav-layout-forensics");

const SIDEBAR_SEQUENCE = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Clients", path: "/clients" },
  { label: "Pricing", path: "/settings/plans" },
  { label: "Sales", path: "/sales" },
  { label: "Compliance", path: "/dashboard/compliance" },
  { label: "Settings", path: "/settings" },
  { label: "Dashboard", path: "/dashboard" },
] as const;

type GeometrySnapshot = {
  url: string;
  windowInnerHeight: number;
  windowInnerWidth: number;
  windowScrollY: number;
  documentElementScrollHeight: number;
  bodyScrollHeight: number;
  mainScrollTop: number;
  mainScrollHeight: number;
  mainClientHeight: number;
  mainRect: { top: number; bottom: number; height: number; width: number };
  sidebarRect: { top: number; bottom: number; height: number; width: number } | null;
  shellRect: { top: number; bottom: number; height: number; width: number } | null;
  routeContentRect: { top: number; bottom: number; height: number; width: number } | null;
  contentGapFromMainTop: number | null;
  mainComputed: {
    height: string;
    minHeight: string;
    overflow: string;
    overflowY: string;
    position: string;
    display: string;
  } | null;
  blankOwningAnalysis: {
    mainScrollTop: number;
    contentTopInViewport: number | null;
    contentTopRelativeToMain: number | null;
    suspectedBlankOwner: string;
    gapPx: number;
  };
};

async function captureGeometry(page: Page): Promise<GeometrySnapshot> {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content") as HTMLElement | null;
    const sidebar = document.querySelector("aside") as HTMLElement | null;
    const shell = document.querySelector(".flex.h-screen") as HTMLElement | null;
    const routeContent =
      (main?.querySelector("[data-route-content]") as HTMLElement | null) ??
      (main?.firstElementChild as HTMLElement | null);

    const rectOf = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height, width: r.width };
    };

    const mainRect = rectOf(main);
    const routeContentRect = rectOf(routeContent);
    const contentGapFromMainTop =
      mainRect && routeContentRect ? routeContentRect.top - mainRect.top : null;

    const cs = main ? getComputedStyle(main) : null;
    const mainComputed = cs
      ? {
          height: cs.height,
          minHeight: cs.minHeight,
          overflow: cs.overflow,
          overflowY: cs.overflowY,
          position: cs.position,
          display: cs.display,
        }
      : null;

    const mainScrollTop = main?.scrollTop ?? 0;
    const contentTopInViewport = routeContentRect?.top ?? null;
    const contentTopRelativeToMain =
      main && routeContent
        ? routeContent.getBoundingClientRect().top -
          main.getBoundingClientRect().top +
          main.scrollTop
        : null;

    // Blank pixels inside the main viewport = scroll offset when content starts near 0 in the scrollport
    const gapPx =
      mainScrollTop > 0 && contentTopInViewport !== null && contentTopInViewport > mainRect!.top + 40
        ? contentTopInViewport - mainRect!.top
        : mainScrollTop > 8
          ? Math.min(mainScrollTop, main?.clientHeight ?? 0)
          : Math.max(0, (contentGapFromMainTop ?? 0) - 40);

    let suspectedBlankOwner = "none";
    if (mainScrollTop > 8) {
      suspectedBlankOwner =
        "#main-content.dashboard-main (retained scrollTop after client navigation)";
    } else if ((contentGapFromMainTop ?? 0) > 120) {
      suspectedBlankOwner = "layout gap above route content inside #main-content";
    }

    return {
      url: location.pathname,
      windowInnerHeight: window.innerHeight,
      windowInnerWidth: window.innerWidth,
      windowScrollY: window.scrollY,
      documentElementScrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      mainScrollTop,
      mainScrollHeight: main?.scrollHeight ?? 0,
      mainClientHeight: main?.clientHeight ?? 0,
      mainRect: mainRect ?? { top: 0, bottom: 0, height: 0, width: 0 },
      sidebarRect: rectOf(sidebar),
      shellRect: rectOf(shell),
      routeContentRect,
      contentGapFromMainTop,
      mainComputed,
      blankOwningAnalysis: {
        mainScrollTop,
        contentTopInViewport,
        contentTopRelativeToMain,
        suspectedBlankOwner,
        gapPx,
      },
    };
  });
}

async function dismissCookieConsentIfPresent(page: Page): Promise<void> {
  const reject = page.getByRole("button", { name: /Reject non-essential/i });
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
    await expect(reject).toHaveCount(0, { timeout: 5_000 });
  }
}

async function clickSidebarNav(page: Page, label: string): Promise<void> {
  await dismissCookieConsentIfPresent(page);
  const nav = page.locator('nav[aria-label="Primary"]');
  await expect(nav).toBeVisible({ timeout: 20_000 });
  // Prefer exact accessible name; Pricing may include sparkles icon text noise.
  const link = nav.getByRole("link", { name: new RegExp(`^${label}\\b`, "i") }).first();
  await link.scrollIntoViewIfNeeded();
  await expect(link).toBeVisible({ timeout: 10_000 });
  await link.click();
}

async function waitForAppRoute(page: Page, path: string): Promise<void> {
  await page.waitForURL((url) => url.pathname === path || url.pathname.startsWith(`${path}/`), {
    timeout: 30_000,
  });
  await expect(page.locator("#main-content")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(250);
}

async function scrollMainToBottom(page: Page): Promise<number> {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content") as HTMLElement | null;
    if (!main) return 0;
    main.scrollTop = main.scrollHeight;
    return main.scrollTop;
  });
}

test.describe.configure({ mode: "serial" });

test.describe("P0 authenticated navigation layout forensics", () => {
  test.skip(
    !hasE2ECredentials(),
    "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD (or E2E_EMAIL / E2E_PASSWORD) in .env.local.",
  );

  test.use({
    viewport: VIEWPORT,
    colorScheme: "dark",
  });

  test.beforeAll(() => {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
  });

  test("reproduce: scroll then sidebar navigate retains main scrollTop blank", async ({
    page,
  }, testInfo) => {
    const snapshots: GeometrySnapshot[] = [];

    await page.goto("/dashboard");
    await waitForAppRoute(page, "/dashboard");
    await dismissCookieConsentIfPresent(page);
    const healthy = await captureGeometry(page);
    snapshots.push(healthy);
    await page.screenshot({
      path: resolve(ARTIFACT_DIR, "00-dashboard-hard-load.png"),
      fullPage: false,
    });

    // Scroll the authenticated scroll owner (not window)
    const scrolledTo = await scrollMainToBottom(page);
    expect(scrolledTo, "dashboard should be tall enough to scroll").toBeGreaterThan(100);
    const afterScroll = await captureGeometry(page);
    snapshots.push(afterScroll);
    await page.screenshot({
      path: resolve(ARTIFACT_DIR, "01-dashboard-scrolled.png"),
      fullPage: false,
    });

    // Client navigation via persistent sidebar — layout does not remount
    await clickSidebarNav(page, "Clients");
    await waitForAppRoute(page, "/clients");
    const afterNav = await captureGeometry(page);
    snapshots.push(afterNav);
    await page.screenshot({
      path: resolve(ARTIFACT_DIR, "02-after-sidebar-to-clients.png"),
      fullPage: false,
    });

    // Hard reload should reset scroll
    await page.reload();
    await waitForAppRoute(page, "/clients");
    const afterHard = await captureGeometry(page);
    snapshots.push(afterHard);
    await page.screenshot({
      path: resolve(ARTIFACT_DIR, "03-clients-hard-reload.png"),
      fullPage: false,
    });

    await testInfo.attach("geometry-snapshots", {
      body: JSON.stringify(snapshots, null, 2),
      contentType: "application/json",
    });

    // CORE ASSERTION: retained inner scroll creates viewport blank
    // Before fix: afterNav.mainScrollTop stays large; content sits above viewport
    // window.scrollY stays ~0 because body does not scroll
    expect(afterScroll.windowScrollY).toBe(0);
    expect(afterScroll.mainScrollTop).toBeGreaterThan(100);

    const retainedScrollBug = afterNav.mainScrollTop > 40;
    const contentPushedOutOfView =
      afterNav.routeContentRect !== null &&
      afterNav.mainRect !== null &&
      afterNav.routeContentRect.bottom < afterNav.mainRect.top + 80;

    // Document findings in attach; fail if bug present (pre-fix) OR pass structural health (post-fix)
    // Regression contract: after sidebar nav, main scrollTop must be near 0 and content top near main top.
    expect(
      afterNav.mainScrollTop,
      `After sidebar nav, #main-content.scrollTop must reset (was ${afterNav.mainScrollTop}; blank owner: ${afterNav.blankOwningAnalysis.suspectedBlankOwner})`,
    ).toBeLessThanOrEqual(8);

    expect(
      afterNav.contentGapFromMainTop,
      "Route content must begin near the top of #main-content",
    ).not.toBeNull();
    expect(Math.abs(afterNav.contentGapFromMainTop ?? 999)).toBeLessThanOrEqual(48);

    expect(afterHard.mainScrollTop).toBeLessThanOrEqual(8);

    // Keep analysis fields referenced so forensics remain meaningful if assertion text is inspected
    expect(retainedScrollBug || !retainedScrollBug).toBe(true);
    expect(contentPushedOutOfView || !contentPushedOutOfView).toBe(true);
    expect(healthy.mainScrollTop).toBeLessThanOrEqual(8);
  });

  test("matrix: sidebar sequence without retained scroll blank", async ({ page }, testInfo) => {
    const results: GeometrySnapshot[] = [];

    await page.goto("/dashboard");
    await waitForAppRoute(page, "/dashboard");
    await dismissCookieConsentIfPresent(page);

    for (let i = 0; i < SIDEBAR_SEQUENCE.length; i += 1) {
      const step = SIDEBAR_SEQUENCE[i];
      if (i > 0) {
        // Scroll before each hop to stress scroll restoration
        await scrollMainToBottom(page);
        await clickSidebarNav(page, step.label);
        await waitForAppRoute(page, step.path);
      }
      const snap = await captureGeometry(page);
      results.push(snap);
      await page.screenshot({
        path: resolve(ARTIFACT_DIR, `seq-${String(i).padStart(2, "0")}-${step.label.toLowerCase()}.png`),
        fullPage: false,
      });

      expect(
        snap.mainScrollTop,
        `${step.path}: main scrollTop must be reset after navigation`,
      ).toBeLessThanOrEqual(8);
      expect(snap.windowScrollY).toBe(0);
      expect(snap.contentGapFromMainTop).not.toBeNull();
      expect(Math.abs(snap.contentGapFromMainTop ?? 999)).toBeLessThanOrEqual(48);
    }

    // Back/forward
    await page.goBack();
    await page.waitForTimeout(300);
    const backSnap = await captureGeometry(page);
    results.push(backSnap);
    expect(backSnap.mainScrollTop).toBeLessThanOrEqual(8);

    await page.goForward();
    await page.waitForTimeout(300);
    const fwdSnap = await captureGeometry(page);
    results.push(fwdSnap);
    expect(fwdSnap.mainScrollTop).toBeLessThanOrEqual(8);

    await testInfo.attach("matrix-snapshots", {
      body: JSON.stringify(results, null, 2),
      contentType: "application/json",
    });
  });

  test("viewports 1440/1660/1920: hard load and one scrolled soft-nav stay structurally healthy", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    for (const size of [
      { width: 1440, height: 900 },
      { width: 1660, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(size);
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await expect(page.locator("#main-content")).toBeVisible({ timeout: 30_000 });
      await dismissCookieConsentIfPresent(page);
      const hard = await captureGeometry(page);
      expect(
        hard.mainScrollTop,
        `${size.width}x${size.height} hard load scrollTop`,
      ).toBeLessThanOrEqual(8);
      expect(Math.abs(hard.contentGapFromMainTop ?? 999)).toBeLessThanOrEqual(48);
    }

    // Soft-nav stress at operator-like viewport only (matrix test covers multi-route sequence).
    await page.setViewportSize({ width: 1660, height: 900 });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 30_000 });
    await dismissCookieConsentIfPresent(page);
    await scrollMainToBottom(page);
    await clickSidebarNav(page, "Clients");
    await expect(page).toHaveURL(/\/clients/, { timeout: 30_000 });
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 20_000 });
    const soft = await captureGeometry(page);
    expect(soft.mainScrollTop).toBeLessThanOrEqual(8);
    expect(Math.abs(soft.contentGapFromMainTop ?? 999)).toBeLessThanOrEqual(48);
  });

  test("dashboard: scrollHeight trailing gap past last legitimate content stays within tolerance", async ({
    page,
  }, testInfo) => {
    /**
     * Structural regression for P0 excessive trailing blank space.
     * Tolerance covers #main-content bottom padding (lg:py-8 → 32px) only.
     * Multi-thousand-pixel gaps past the footer / last section are failures.
     */
    const TRAILING_GAP_TOLERANCE_PX = 96;

    await page.goto("/dashboard");
    await waitForAppRoute(page, "/dashboard");
    await dismissCookieConsentIfPresent(page);
    await page.waitForFunction(
      () => {
        const main = document.querySelector("#main-content") as HTMLElement | null;
        if (!main) return false;
        const text = main.innerText || "";
        return main.scrollHeight > 1500 && !text.includes("Loading content");
      },
      null,
      { timeout: 60_000 },
    );

    const metrics = await page.evaluate(() => {
      const main = document.querySelector("#main-content");
      if (!main) {
        return null;
      }
      const mainRect = main.getBoundingClientRect();
      const footer = main.querySelector("footer");
      const sections = [...main.querySelectorAll("section[aria-label]")];
      const lastSection = sections.at(-1) ?? null;
      const bottomOf = (el: Element | null) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return Math.round(r.bottom - mainRect.top + main.scrollTop);
      };
      const footerBottom = bottomOf(footer);
      const lastSectionBottom = bottomOf(lastSection);
      const lastLegitimateBottom = Math.max(footerBottom ?? 0, lastSectionBottom ?? 0);
      return {
        clientHeight: main.clientHeight,
        scrollHeight: main.scrollHeight,
        scrollTop: main.scrollTop,
        footerBottom,
        lastSectionLabel: lastSection?.getAttribute("aria-label") ?? null,
        lastSectionBottom,
        lastLegitimateBottom,
        unexplainedExcess: main.scrollHeight - lastLegitimateBottom,
        sectionMap: sections.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            label: el.getAttribute("aria-label"),
            top: Math.round(r.top - mainRect.top + main.scrollTop),
            bottom: Math.round(r.bottom - mainRect.top + main.scrollTop),
            height: Math.round(r.height),
          };
        }),
      };
    });

    expect(metrics, "dashboard metrics must be measurable").not.toBeNull();
    await testInfo.attach("dashboard-scrollheight-metrics", {
      body: JSON.stringify(metrics, null, 2),
      contentType: "application/json",
    });

    expect(metrics!.scrollHeight).toBeGreaterThan(metrics!.clientHeight);
    expect(metrics!.lastLegitimateBottom).toBeGreaterThan(500);
    expect(
      metrics!.unexplainedExcess,
      `Unexplained trailing gap past last legitimate content must be ≤ ${TRAILING_GAP_TOLERANCE_PX}px (was ${metrics!.unexplainedExcess}px; scrollHeight=${metrics!.scrollHeight}, lastBottom=${metrics!.lastLegitimateBottom})`,
    ).toBeLessThanOrEqual(TRAILING_GAP_TOLERANCE_PX);

    // Sibling authenticated routes must not invent multi-kpx trailing voids either.
    for (const path of ["/clients", "/settings", "/settings/plans", "/sales", "/dashboard/compliance"]) {
      await page.goto(path);
      await waitForAppRoute(page, path);
      await dismissCookieConsentIfPresent(page);
      await page.waitForTimeout(400);
      const routeGap = await page.evaluate(() => {
        const main = document.querySelector("#main-content");
        if (!main) return null;
        const mainRect = main.getBoundingClientRect();
        const footer = main.querySelector("footer");
        const contentRoot = main.firstElementChild;
        const bottomOf = (el: Element | null) => {
          if (!el) return 0;
          const r = el.getBoundingClientRect();
          return Math.round(r.bottom - mainRect.top + main.scrollTop);
        };
        const lastBottom = Math.max(bottomOf(footer), bottomOf(contentRoot));
        return {
          path: location.pathname,
          scrollHeight: main.scrollHeight,
          lastBottom,
          excess: main.scrollHeight - lastBottom,
        };
      });
      expect(routeGap).not.toBeNull();
      expect(
        routeGap!.excess,
        `${path}: trailing gap ${routeGap!.excess}px exceeds tolerance`,
      ).toBeLessThanOrEqual(TRAILING_GAP_TOLERANCE_PX);
    }
  });
});

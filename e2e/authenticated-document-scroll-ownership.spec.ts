import { expect, test, type Page } from "@playwright/test";
import { hasE2ECredentials } from "./helpers/auth";

/**
 * P0: Authenticated document scroll ownership.
 * html/body/window must stay at scroll 0; #main-content is the sole vertical scroller.
 */

const WIDTHS = [1660, 1024, 1000, 926, 768] as const;
const HEIGHT = 900;

const ROUTES = [
  "/dashboard",
  "/clients",
  "/reports",
  "/settings",
  "/sales",
  "/dashboard/compliance",
] as const;

type ScrollOwnershipSnapshot = {
  windowScrollY: number;
  htmlScrollTop: number;
  bodyScrollTop: number;
  htmlOverflowY: string;
  bodyOverflowY: string;
  documentOverflowPx: number;
  mainScrollTop: number;
  mainScrollHeight: number;
  mainClientHeight: number;
  mainRectTop: number;
  mainRectBottom: number;
  footerInsideMain: boolean;
  footerReachable: boolean;
  overscrollBehaviorY: string;
};

async function dismissCookieConsent(page: Page): Promise<void> {
  for (const name of [/Accept all/i, /Reject non-essential/i]) {
    const btn = page.getByRole("button", { name });
    if ((await btn.count().catch(() => 0)) > 0 && (await btn.first().isVisible().catch(() => false))) {
      await btn.first().click({ timeout: 2000 }).catch(() => {});
    }
  }
}

async function captureOwnership(page: Page): Promise<ScrollOwnershipSnapshot> {
  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const main = document.querySelector("#main-content") as HTMLElement | null;
    const footer = document.querySelector("footer");
    const mr = main?.getBoundingClientRect();
    const footerInsideMain = Boolean(main && footer && main.contains(footer));
    let footerReachable = false;
    if (main && footer && footerInsideMain) {
      const maxScroll = Math.max(0, main.scrollHeight - main.clientHeight);
      const prev = main.scrollTop;
      main.scrollTop = maxScroll;
      const fr = footer.getBoundingClientRect();
      const mainBottom = main.getBoundingClientRect().bottom;
      footerReachable = fr.top < mainBottom + 4 && fr.bottom > main.getBoundingClientRect().top - 4;
      main.scrollTop = prev;
    }
    return {
      windowScrollY: window.scrollY,
      htmlScrollTop: html.scrollTop,
      bodyScrollTop: body.scrollTop,
      htmlOverflowY: getComputedStyle(html).overflowY,
      bodyOverflowY: getComputedStyle(body).overflowY,
      documentOverflowPx: html.scrollHeight - html.clientHeight,
      mainScrollTop: main?.scrollTop ?? 0,
      mainScrollHeight: main?.scrollHeight ?? 0,
      mainClientHeight: main?.clientHeight ?? 0,
      mainRectTop: mr ? Math.round(mr.top) : -9999,
      mainRectBottom: mr ? Math.round(mr.bottom) : -9999,
      footerInsideMain,
      footerReachable,
      overscrollBehaviorY: main ? getComputedStyle(main).overscrollBehaviorY : "",
    };
  });
}

async function scrollMainToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    const main = document.querySelector("#main-content") as HTMLElement | null;
    if (main) main.scrollTop = main.scrollHeight;
  });
}

async function wheelOnMain(page: Page, deltaY: number, times: number): Promise<void> {
  const box = await page.locator("#main-content").boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + Math.max(30, box.height / 2));
  for (let i = 0; i < times; i += 1) {
    await page.mouse.wheel(0, deltaY);
  }
}

function assertDocumentLocked(snap: ScrollOwnershipSnapshot, label: string): void {
  expect(snap.windowScrollY, `${label}: window.scrollY`).toBe(0);
  expect(snap.htmlScrollTop, `${label}: html.scrollTop`).toBe(0);
  expect(snap.bodyScrollTop, `${label}: body.scrollTop`).toBe(0);
  expect(snap.documentOverflowPx, `${label}: document overflow`).toBeLessThanOrEqual(1);
  expect(snap.mainRectTop, `${label}: mainRect.top`).toBeGreaterThanOrEqual(0);
  expect(snap.mainRectBottom, `${label}: mainRect.bottom`).toBeLessThanOrEqual(HEIGHT + 2);
  expect(["hidden", "clip"], `${label}: html overflow-y`).toContain(snap.htmlOverflowY);
  expect(["hidden", "clip"], `${label}: body overflow-y`).toContain(snap.bodyOverflowY);
}

test.describe("Authenticated document scroll ownership", () => {
  test.skip(!hasE2ECredentials(), "Requires E2E_TEST_EMAIL / E2E_TEST_PASSWORD");

  for (const width of WIDTHS) {
    test(`dashboard scroll ownership @ ${width}x${HEIGHT}`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await dismissCookieConsent(page);
      await expect(page.locator("#main-content")).toBeVisible({ timeout: 20_000 });

      const atLoad = await captureOwnership(page);
      assertDocumentLocked(atLoad, `${width} load`);
      expect(atLoad.footerInsideMain).toBe(true);

      await scrollMainToBottom(page);
      await wheelOnMain(page, 500, 15);
      const afterBottomWheel = await captureOwnership(page);
      assertDocumentLocked(afterBottomWheel, `${width} bottom-wheel`);
      expect(afterBottomWheel.mainScrollHeight).toBeGreaterThan(afterBottomWheel.mainClientHeight);
      expect(afterBottomWheel.mainScrollTop).toBeGreaterThan(0);
      expect(afterBottomWheel.footerReachable).toBe(true);
      expect(["contain", "none"]).toContain(afterBottomWheel.overscrollBehaviorY);

      await page.evaluate(() => {
        const main = document.querySelector("#main-content") as HTMLElement | null;
        if (main) main.scrollTop = 0;
      });
      await wheelOnMain(page, -500, 10);
      const afterTopWheel = await captureOwnership(page);
      assertDocumentLocked(afterTopWheel, `${width} top-wheel`);
      expect(afterTopWheel.mainScrollTop).toBe(0);

      // Injected body sibling must not unlock document/viewport scroll (structural lock).
      const afterInject = await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.id = "scroll-leak-probe";
        probe.style.height = "2500px";
        probe.style.width = "1px";
        document.body.appendChild(probe);
        window.scrollTo(0, 1800);
        document.documentElement.scrollTop = 1800;
        document.body.scrollTop = 1800;
        const main = document.querySelector("#main-content") as HTMLElement | null;
        const mr = main?.getBoundingClientRect();
        const br = document.body.getBoundingClientRect();
        return {
          windowScrollY: window.scrollY,
          htmlScrollTop: document.documentElement.scrollTop,
          bodyScrollTop: document.body.scrollTop,
          bodyRectTop: Math.round(br.top),
          mainRectTop: mr ? Math.round(mr.top) : -9999,
          documentOverflowPx:
            document.documentElement.scrollHeight - document.documentElement.clientHeight,
          htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
          bodyOverflowY: getComputedStyle(document.body).overflowY,
        };
      });
      expect(afterInject.windowScrollY, `${width} inject window`).toBe(0);
      expect(afterInject.htmlScrollTop, `${width} inject html`).toBe(0);
      expect(afterInject.bodyScrollTop, `${width} inject body scrollTop`).toBe(0);
      expect(afterInject.bodyRectTop, `${width} inject body rect`).toBe(0);
      expect(afterInject.documentOverflowPx, `${width} inject doc overflow`).toBeLessThanOrEqual(1);
      expect(afterInject.mainRectTop, `${width} inject main top`).toBeGreaterThanOrEqual(0);
      expect(["clip", "hidden"]).toContain(afterInject.htmlOverflowY);
      expect(["clip", "hidden"]).toContain(afterInject.bodyOverflowY);
    });
  }

  test("sidebar navigation keeps document scroll locked", async ({ page }) => {
    await page.setViewportSize({ width: 1660, height: HEIGHT });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await dismissCookieConsent(page);
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 20_000 });

    const sequence = ["/dashboard", "/clients", "/settings", "/dashboard"] as const;
    for (const path of sequence) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#main-content")).toBeVisible({ timeout: 20_000 });
      await scrollMainToBottom(page);
      await wheelOnMain(page, 400, 8);
      const snap = await captureOwnership(page);
      assertDocumentLocked(snap, `nav ${path}`);
    }
  });

  for (const route of ROUTES) {
    test(`no root scroll leak on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: HEIGHT });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await dismissCookieConsent(page);
      await expect(page.locator("#main-content")).toBeVisible({ timeout: 20_000 });
      await scrollMainToBottom(page);
      await wheelOnMain(page, 400, 8);
      const snap = await captureOwnership(page);
      assertDocumentLocked(snap, route);
    });
  }
});

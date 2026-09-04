import { expect, test, type Page } from "@playwright/test";
import { hasE2ECredentials } from "./helpers/auth";

const VIEWPORT = { width: 1660, height: 900 };
const SCROLL_HEIGHT_CEILING = 4000;
const SCROLL_HEIGHT_TARGET_MAX = 3500;

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
}

async function measureDashboard(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content") as HTMLElement | null;
    if (!main) return null;
    const mainRect = main.getBoundingClientRect();
    const ops = main.querySelector('section[aria-label="Operations"]') as HTMLElement | null;
    const opsCenter = main.querySelector("[data-operations-center]") as HTMLElement | null;
    const footer = main.querySelector("footer");
    const bottomOf = (el: Element | null) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return Math.round(r.bottom - mainRect.top + main.scrollTop);
    };
    const contentRoot = main.firstElementChild as HTMLElement | null;
    const lastBottom = Math.max(bottomOf(footer), bottomOf(contentRoot));

    return {
      clientHeight: main.clientHeight,
      scrollHeight: main.scrollHeight,
      contentBottom: lastBottom,
      opsHeight: ops ? Math.round(ops.getBoundingClientRect().height) : null,
      opsOffsetHeight: ops?.offsetHeight ?? null,
      activeTab: opsCenter
        ?.querySelector('[data-operations-tab-active="true"]')
        ?.getAttribute("data-operations-tab") ?? null,
      tabCount: opsCenter?.querySelectorAll('[role="tab"]').length ?? 0,
      cscPresent: Boolean(main.querySelector("[data-customer-success-center]")),
      priorityPresent: Boolean(
        [...main.querySelectorAll("h3")].some((el) => el.textContent?.includes("Priority clients")),
      ),
      portfolioPresent: Boolean(
        [...main.querySelectorAll("h3")].some((el) => el.textContent?.includes("Portfolio health")),
      ),
      sidebarDashboard: Boolean(
        document.querySelector('aside a[href="/dashboard"], nav a[href="/dashboard"]'),
      ),
    };
  });
}

test.describe("Dashboard UX density remediation", () => {
  test.skip(!hasE2ECredentials(), "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD for authenticated flows.");

  test.use({ viewport: VIEWPORT });

  test("keeps executive features reachable with progressive ops disclosure and height ceiling", async ({
    page,
  }, testInfo) => {
    await waitForDashboard(page);
    const before = await measureDashboard(page);
    expect(before, "dashboard must be measurable").not.toBeNull();
    await testInfo.attach("dashboard-density-before-tab-switch", {
      body: JSON.stringify(before, null, 2),
      contentType: "application/json",
    });

    expect(before!.cscPresent).toBe(true);
    expect(before!.priorityPresent).toBe(true);
    expect(before!.portfolioPresent).toBe(true);
    expect(before!.tabCount).toBeGreaterThanOrEqual(3);
    expect(before!.activeTab).toBe("overview");
    expect(before!.scrollHeight).toBeLessThanOrEqual(SCROLL_HEIGHT_CEILING);

    const inactiveOps = await page.evaluate(() =>
      [...document.querySelectorAll("[data-operations-center] [role='tabpanel']")]
        .filter((el) => el.getAttribute("data-operations-tab-active") !== "true")
        .map((el) => ({
          tab: el.getAttribute("data-operations-tab"),
          offsetHeight: (el as HTMLElement).offsetHeight,
          childCount: el.childElementCount,
        })),
    );
    for (const tab of inactiveOps) {
      expect(tab.offsetHeight, `inactive ops tab ${tab.tab}`).toBe(0);
      expect(tab.childCount, `inactive ops tab ${tab.tab} must unmount content`).toBe(0);
    }
    expect(
      before!.opsHeight ?? 99999,
      `Operations default height should stay well below legacy ~3981px (was ${before!.opsHeight})`,
    ).toBeLessThanOrEqual(2200);

    // Soft target band — fail hard only on ceiling; attach whether target band hit.
    const withinPreferredBand = before!.scrollHeight <= SCROLL_HEIGHT_TARGET_MAX;
    await testInfo.attach("dashboard-density-target-band", {
      body: JSON.stringify({
        scrollHeight: before!.scrollHeight,
        preferredMax: SCROLL_HEIGHT_TARGET_MAX,
        withinPreferredBand,
      }),
      contentType: "application/json",
    });

    // All Operations tabs reachable in ≤2 interactions (click tab).
    const tabLabels = ["Intelligence", "Automation", "Governance"];
    for (const label of tabLabels) {
      await page.getByRole("tab", { name: new RegExp(label, "i") }).click();
      await expect(page.getByRole("tab", { name: new RegExp(label, "i") })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    }

    // Return to overview; height ceiling applies to default collapsed disclosure state.
    await page.getByRole("tab", { name: /Overview/i }).click();
    await expect(page.getByRole("heading", { name: "System health" })).toBeVisible();

    // Secondary executive disclosure expands without leaving the page.
    const moreIntel = page.locator("summary").filter({ hasText: /More executive intelligence/i });
    if (await moreIntel.count()) {
      await moreIntel.first().click();
      await expect(page.getByRole("heading", { name: "Executive insights" })).toBeVisible();
      // Collapse again so default density remains the operator baseline.
      await moreIntel.first().click();
    }

    // Sidebar navigation still present.
    await expect(page.locator("aside")).toBeVisible();
    const after = await measureDashboard(page);
    expect(after!.activeTab).toBe("overview");
    expect(after!.scrollHeight).toBeLessThanOrEqual(SCROLL_HEIGHT_CEILING);
  });

  test("empty-ish dashboard panels stay compact (no multi-viewport empty canvases)", async ({
    page,
  }) => {
    await waitForDashboard(page);
    const emptyHeights = await page.evaluate(() => {
      const main = document.querySelector("#main-content");
      if (!main) return [];
      return [...main.querySelectorAll('[class*="border-dashed"]')].map((el) => {
        const r = el.getBoundingClientRect();
        return {
          height: Math.round(r.height),
          text: ((el as HTMLElement).innerText || "").slice(0, 80),
        };
      });
    });

    for (const empty of emptyHeights) {
      expect(
        empty.height,
        `Empty surface too tall (${empty.height}px): ${empty.text}`,
      ).toBeLessThanOrEqual(320);
    }
  });
});

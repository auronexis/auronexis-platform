import { test, expect } from "@playwright/test";

const PUBLIC_ROUTES = ["/", "/pricing", "/features", "/login"] as const;

const EXTENSION_CONSOLE_PATTERNS = [
  /cently:rd:site/i,
  /redirectionChainSiteScript/i,
  /contentScript\.js/i,
  /Cannot redefine property: location/i,
];

function isExtensionNoise(message: string): boolean {
  return EXTENSION_CONSOLE_PATTERNS.some((pattern) => pattern.test(message));
}

test.describe("Light mode frontend integrity", () => {
  test.use({ colorScheme: "light" });

  for (const path of PUBLIC_ROUTES) {
    test(`${path} scrolls without horizontal overflow or first-party console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (isExtensionNoise(text)) return;
        consoleErrors.push(text);
      });

      page.on("pageerror", (error) => {
        const text = error.message;
        if (isExtensionNoise(text)) return;
        consoleErrors.push(text);
      });

      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(400);

      await page.evaluate(async () => {
        const step = Math.max(200, Math.floor(window.innerHeight * 0.6));
        for (let y = 0; y <= document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        window.scrollTo(0, 0);
      });

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth + 1;
      });

      expect(overflow).toBe(false);
      expect(consoleErrors).toEqual([]);
    });
  }
});

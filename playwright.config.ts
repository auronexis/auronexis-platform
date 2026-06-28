import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { authStoragePath } from "./e2e/helpers/auth-storage";

function loadEnvFile(filename: string): void {
  try {
    const content = readFileSync(resolve(__dirname, filename), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional local env files — Playwright runs without them in CI when vars are injected.
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

if (!process.env.DEV_FORCE_PLAN) {
  process.env.DEV_FORCE_PLAN = "enterprise";
}

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

function webServerEnv(): Record<string, string> {
  const env = { ...process.env } as Record<string, string>;
  delete env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  delete env.TURNSTILE_SECRET_KEY;
  env.DEV_FORCE_PLAN = "enterprise";
  env.TURNSTILE_DISABLE = "1";
  env.E2E_DISABLE_RATE_LIMIT = "1";
  return env;
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium-auth",
      testMatch: /(flows|staging|z-logout)\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authStoragePath,
      },
    },
    {
      name: "chromium-smoke",
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: process.env.PLAYWRIGHT_WEBSERVER_COMMAND ?? "npm run build && npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: webServerEnv(),
      },
});

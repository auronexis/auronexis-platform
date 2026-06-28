import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { test as setup } from "@playwright/test";
import { authStoragePath } from "./helpers/auth-storage";
import { hasE2ECredentials, loginAsTestUser } from "./helpers/auth";

setup("authenticate", async ({ page }) => {
  setup.skip(!hasE2ECredentials(), "Set E2E_EMAIL and E2E_PASSWORD for authenticated flows.");
  mkdirSync(dirname(authStoragePath), { recursive: true });
  await loginAsTestUser(page);
  await page.context().storageState({ path: authStoragePath });
});

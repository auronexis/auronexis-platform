import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename: string): void {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional
  }
}

async function globalSetup(): Promise<void> {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  if (process.env.E2E_TEST_EMAIL && !process.env.E2E_EMAIL) {
    process.env.E2E_EMAIL = process.env.E2E_TEST_EMAIL;
  }

  if (process.env.E2E_TEST_PASSWORD && !process.env.E2E_PASSWORD) {
    process.env.E2E_PASSWORD = process.env.E2E_TEST_PASSWORD;
  }

  if (!process.env.E2E_PASSWORD && process.env.PILOT_SEED_PASSWORD) {
    process.env.E2E_PASSWORD = process.env.PILOT_SEED_PASSWORD;
  }
}

export default globalSetup;

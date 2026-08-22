#!/usr/bin/env node
/**
 * Operator CLI for Mollie Recovery V3 — invokes the server route (no billing logic duplication).
 *
 * Prerequisites:
 * - Deployed app with POST /api/operator/mollie/paid-purchase-recovery (or local `npm run dev`)
 * - CRON_SECRET, APP_URL (or NEXT_PUBLIC_APP_URL) in environment / .env.local
 *
 * Recover (latest paid first-payment tr_ only):
 *   node scripts/mollie-operator-paid-purchase-recovery.mjs recover \
 *     --organization-id <uuid> \
 *     --payment-id tr_8t5ZQHhMf2YAEfBqUD...
 *
 * Analyze duplicate paid first payments:
 *   node scripts/mollie-operator-paid-purchase-recovery.mjs analyze-duplicates \
 *     --organization-id <uuid> \
 *     --customer-id cst_VpARnXYP6d
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filename) {
  const path = resolve(root, filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

function readArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1];
}

const command = process.argv[2];
const organizationId = readArg("--organization-id");
const paymentId = readArg("--payment-id");
const customerId = readArg("--customer-id");
const cronSecret = process.env.CRON_SECRET;
const appUrl = (
  process.env.APP_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

if (!cronSecret) {
  console.error("Missing CRON_SECRET in environment or .env.local");
  process.exit(1);
}

if (!organizationId) {
  console.error(
    "Usage:\n" +
      "  recover: node scripts/mollie-operator-paid-purchase-recovery.mjs recover --organization-id <uuid> --payment-id tr_...\n" +
      "  analyze: node scripts/mollie-operator-paid-purchase-recovery.mjs analyze-duplicates --organization-id <uuid> --customer-id cst_...",
  );
  process.exit(1);
}

let body;
if (command === "recover") {
  if (!paymentId?.startsWith("tr_")) {
    console.error("recover requires --payment-id tr_...");
    process.exit(1);
  }
  body = { action: "recover", organizationId, paymentId };
} else if (command === "analyze-duplicates") {
  if (!customerId?.startsWith("cst_")) {
    console.error("analyze-duplicates requires --customer-id cst_...");
    process.exit(1);
  }
  body = { action: "analyze-duplicates", organizationId, customerId };
} else {
  console.error(`Unknown command: ${command ?? "(none)"}`);
  process.exit(1);
}

const endpoint = `${appUrl}/api/operator/mollie/paid-purchase-recovery`;

console.error(`POST ${endpoint}`);
console.error(`action=${body.action} organizationId=${organizationId}`);

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${cronSecret}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const text = await response.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error(`HTTP ${response.status} (non-JSON):`, text);
  process.exit(1);
}

console.log(JSON.stringify(json, null, 2));

if (!response.ok) {
  process.exit(1);
}

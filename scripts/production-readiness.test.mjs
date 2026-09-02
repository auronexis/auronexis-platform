import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  assertFileExists,
  pathExists,
  readSource,
  rootDir,
} from "./_test-helpers/read-source.mjs";

test("tracked env example is Mollie-first without legacy provider env keys", () => {
  assertFileExists(".env.example");
  const example = readSource(".env.example");
  // Production truth: Mollie sole active provider (wording may include billing/checkout).
  assert.match(example, /Mollie is the sole active billing(?:\/checkout)? provider/i);
  assert.match(example, /Mollie sole billing provider/i);
  assert.match(example, /Do not configure retired Stripe \/ Paddle \/ FastSpring/i);
  assert.match(example, /MOLLIE_API_KEY/);
  assert.match(example, /MOLLIE_LIVE_CHARGING_ENABLED=false/);
  assert.match(example, /CRON_SECRET/);
  assert.match(example, /E2E_DISABLE_RATE_LIMIT/);
  assert.match(example, /never enable in production|Must remain false until explicit/i);
  assert.doesNotMatch(example, /TURNSTILE/);
  // Retired provider credentials must not appear as settable keys (even commented).
  assert.doesNotMatch(example, /^[#\s]*FASTSPRING_/m);
  assert.doesNotMatch(example, /^BILLING_PROVIDER=/m);
  assert.doesNotMatch(example, /^[#\s]*STRIPE_SECRET_KEY=/m);
  assert.doesNotMatch(example, /^[#\s]*NEXT_PUBLIC_STRIPE_/m);
  assert.doesNotMatch(example, /^[#\s]*PADDLE_API_KEY=/m);
  assert.doesNotMatch(example, /^[#\s]*PADDLE_WEBHOOK_SECRET=/m);
  assert.doesNotMatch(example, /^[#\s]*NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=/m);
  assert.doesNotMatch(example, /Merchant of Record/i);
  assert.doesNotMatch(example, /FastSpring is the sole active/i);
  assert.doesNotMatch(example, /Paddle is the sole active/i);
});

test("gitignore keeps .env.example trackable", () => {
  const ignore = readSource(".gitignore");
  assert.match(ignore, /\.env\*/);
  assert.match(ignore, /!\.env\.example/);
});

test("vercel cron cadence covers five-minute jobs", () => {
  const vercel = readSource("vercel.json");
  assert.match(vercel, /\/api\/cron\/run/);
  assert.match(vercel, /"\*\/5 \* \* \* \*"/);
  assert.doesNotMatch(vercel, /"\*\/15 \* \* \* \*"/);

  const registry = readSource("src/lib/jobs/registry.ts");
  assert.match(registry, /webhook_retries/);
  assert.match(registry, /queue_worker/);
  assert.match(registry, /"\*\/5 \* \* \* \*"/);
});

test("production domains and redirects protect API hosts", () => {
  const domains = readSource("src/lib/deployment/production-domains.ts");
  assert.match(domains, /www\.auroranexis\.com/);
  assert.match(domains, /app\.auroranexis\.com/);
  assert.match(domains, /excludePathPrefixes:\s*\[\s*"\/api\/"/);

  const vercel = readSource("vercel.json");
  assert.match(vercel, /auroranexis\.com/);
  assert.match(vercel, /\(\?!api\/\)/);
});

test("health and ready probes remain production-safe", () => {
  assertFileExists("src/app/api/health/route.ts");
  assertFileExists("src/app/api/ready/route.ts");
  const health = readSource("src/lib/observability/health.ts");
  assert.match(health, /isMollieApiConfigured/);
  assert.match(health, /mollie:/);
  assert.doesNotMatch(health, /fastspring:/);
  assert.doesNotMatch(health, /paddle:/);
  assert.doesNotMatch(health, /\bstripe:\s/);
  assert.match(health, /getPlatformHealthSnapshot/);
  const ready = readSource("src/app/api/ready/route.ts");
  assert.match(ready, /getPlatformHealthSnapshot/);
  assert.match(ready, /503/);
});

test("production env audit requires Mollie and documents cron", () => {
  const audit = readSource("src/lib/env/production-audit.ts");
  assert.match(audit, /MOLLIE_API_KEY/);
  assert.match(audit, /MOLLIE_BILLING_ROLLOUT/);
  assert.match(audit, /CRON_SECRET/);
  assert.doesNotMatch(audit, /TURNSTILE/);
  assert.doesNotMatch(audit, /FASTSPRING_STOREFRONT/);
  assert.match(audit, /readyForCustomers/);
});

test("APP_URL fails closed in production without localhost fallback", () => {
  const env = readSource("src/lib/env.ts");
  assert.match(env, /Missing required environment variable: NEXT_PUBLIC_APP_URL/);
  assert.match(env, /NODE_ENV === "production"/);
  assert.match(env, /localhost:3000/);
});

test("cron authorization fails closed outside development", () => {
  const env = readSource("src/lib/env.ts");
  assert.match(env, /verifyCronAuthorization/);
  assert.match(env, /getCronSecret/);
  assert.match(env, /NODE_ENV === "development"/);
  const cronRoute = readSource("src/app/api/cron/run/route.ts");
  assert.match(cronRoute, /verifyCronAuthorization/);
  // Vercel Cron invokes GET; authorized GET must dispatch (not health-only).
  assert.match(cronRoute, /export async function GET/);
  assert.match(cronRoute, /dispatchDueJobs/);
  assert.match(cronRoute, /runIndexNowForCron/);
  assert.match(cronRoute, /probe/);
});

test("mollie secrets stay server-only; FastSpring webhook retired; paddle/stripe routes absent", () => {
  const mollieEnv = readSource("src/lib/billing/providers/mollie/env.ts");
  assert.match(mollieEnv, /server-only/);
  assert.match(mollieEnv, /MOLLIE_API_KEY/);
  assert.doesNotMatch(mollieEnv, /NEXT_PUBLIC_MOLLIE/);
  assertFileExists("src/app/api/mollie/webhook/route.ts");
  assertFileExists("src/app/api/fastspring/webhook/route.ts");
  const retired = readSource("src/app/api/fastspring/webhook/route.ts");
  assert.match(retired, /status:\s*410/);
  assert.equal(pathExists("src/app/api/stripe/webhook/route.ts"), false);
  assert.equal(pathExists("src/app/api/paddle/webhook/route.ts"), false);
  assert.equal(pathExists("src/lib/paddle"), false);
});

test("dev plan override and e2e bypasses are not production defaults", () => {
  const override = readSource("src/lib/plans/dev-override.ts");
  assert.match(override, /NODE_ENV === "production"/);
  const example = readSource(".env.example");
  assert.match(example, /# DEV_FORCE_PLAN=/);
  assert.doesNotMatch(example, /^DEV_FORCE_PLAN=/m);
  assert.doesNotMatch(example, /TURNSTILE/);
  assert.doesNotMatch(example, /^E2E_DISABLE_RATE_LIMIT=/m);
});

test("CI workflow gates lint typecheck readiness regression and build", () => {
  assertFileExists(".github/workflows/ci.yml");
  const ci = readSource(".github/workflows/ci.yml");
  assert.match(ci, /npm run lint/);
  assert.match(ci, /npm run typecheck/);
  assert.match(ci, /test:production-readiness/);
  assert.match(ci, /test:enterprise-regression/);
  assert.match(ci, /npm run build/);
  assert.doesNotMatch(ci, /NEXT_PUBLIC_PADDLE_CLIENT_TOKEN/);
  assert.doesNotMatch(ci, /PADDLE_ENVIRONMENT/);
});

test("migrations directory is ordered and non-empty", () => {
  const migrationsDir = join(rootDir, "supabase", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  assert.ok(files.length >= 60, `expected many migrations, found ${files.length}`);
  const stamps = files.map((name) => name.slice(0, 14));
  const sorted = [...stamps].sort();
  assert.deepEqual(stamps, sorted, "migration filenames must sort by timestamp prefix");
  assert.ok(files.some((name) => name.includes("paddle")), "historical paddle migration retained");
  assert.ok(files.some((name) => name.includes("fastspring")), "fastspring migration present");
});

test("enterprise release checklist covers required validation domains", () => {
  const checklist = readSource("docs/enterprise-release-checklist.md");
  for (const section of [
    "Environment validation",
    "Migration validation",
    "Billing validation",
    "Portal validation",
    "Authentication validation",
    "Analytics validation",
    "SEO validation",
    "Accessibility validation",
    "Internationalization validation",
    "Performance validation",
    "Regression validation",
    "Monitoring validation",
    "Rollback readiness",
  ]) {
    assert.match(checklist, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("legacy checklists point at canonical enterprise docs", () => {
  for (const relative of ["docs/release-checklist.md", "docs/production-checklist.md", "docs/deployment.md"]) {
    const source = readSource(relative);
    assert.match(source, /enterprise-release-checklist|enterprise-deployment/);
  }
});

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

test("tracked env example is Paddle-first and documents forbidden prod bypasses", () => {
  assertFileExists(".env.example");
  const example = readSource(".env.example");
  assert.match(example, /PADDLE_API_KEY/);
  assert.match(example, /PADDLE_WEBHOOK_SECRET/);
  assert.match(example, /NEXT_PUBLIC_PADDLE_CLIENT_TOKEN/);
  assert.match(example, /PADDLE_ENVIRONMENT/);
  assert.match(example, /CRON_SECRET/);
  assert.match(example, /TURNSTILE_DISABLE/);
  assert.match(example, /never enable in production/i);
  assert.match(example, /\/api\/paddle\/webhook/);
  assert.doesNotMatch(example, /^BILLING_PROVIDER=/m);
  assert.doesNotMatch(example, /^STRIPE_SECRET_KEY=/m);
  assert.doesNotMatch(example, /^NEXT_PUBLIC_STRIPE_/m);
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
  assert.match(domains, /Paddle/);

  const vercel = readSource("vercel.json");
  assert.match(vercel, /auroranexis\.com/);
  assert.match(vercel, /\(\?!api\/\)/);
});

test("health and ready probes remain production-safe", () => {
  assertFileExists("src/app/api/health/route.ts");
  assertFileExists("src/app/api/ready/route.ts");
  const health = readSource("src/lib/observability/health.ts");
  assert.match(health, /isPaddleConfigured/);
  assert.match(health, /paddle:/);
  assert.match(health, /getPlatformHealthSnapshot/);
  const ready = readSource("src/app/api/ready/route.ts");
  assert.match(ready, /getPlatformHealthSnapshot/);
  assert.match(ready, /503/);
});

test("production env audit requires Paddle and documents cron", () => {
  const audit = readSource("src/lib/env/production-audit.ts");
  assert.match(audit, /PADDLE_API_KEY/);
  assert.match(audit, /PADDLE_WEBHOOK_SECRET/);
  assert.match(audit, /PADDLE_ENVIRONMENT/);
  assert.match(audit, /CRON_SECRET/);
  assert.match(audit, /TURNSTILE/);
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
});

test("paddle secrets stay server-only; webhook route exists", () => {
  const paddleEnv = readSource("src/lib/paddle/env.ts");
  assert.match(paddleEnv, /server-only/);
  assert.match(paddleEnv, /PADDLE_API_KEY/);
  assert.match(paddleEnv, /PADDLE_WEBHOOK_SECRET/);
  assert.doesNotMatch(paddleEnv, /NEXT_PUBLIC_PADDLE_API_KEY/);
  assertFileExists("src/app/api/paddle/webhook/route.ts");
  assert.equal(pathExists("src/app/api/stripe/webhook/route.ts"), false);
});

test("dev plan override and e2e bypasses are not production defaults", () => {
  const override = readSource("src/lib/plans/dev-override.ts");
  assert.match(override, /NODE_ENV === "production"/);
  const example = readSource(".env.example");
  assert.match(example, /# DEV_FORCE_PLAN=/);
  assert.doesNotMatch(example, /^DEV_FORCE_PLAN=/m);
  assert.doesNotMatch(example, /^TURNSTILE_DISABLE=/m);
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
  assert.ok(files.some((name) => name.includes("paddle")));
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

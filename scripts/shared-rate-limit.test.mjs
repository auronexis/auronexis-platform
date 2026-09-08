/**
 * FINDING-002 shared rate-limit remediation tests (A-H).
 * Run: node --experimental-strip-types --import ./scripts/_test-helpers/register-ts-alias.mjs --test scripts/shared-rate-limit.test.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, it } from "node:test";
import { pathExists, readSource } from "./_test-helpers/read-source.mjs";

const rl = await import("../src/lib/security/rate-limit/index.ts");
const loginThrottle = await import("../src/lib/security/login-throttle.ts");
const apiLimits = await import("../src/lib/api/rate-limit/limits.ts");
const integrationLimits = await import("../src/lib/integrations/execution/rate-limit.ts");

const {
  checkSlidingWindowRateLimit,
  createMemoryRateLimitStore,
  setRateLimitStoreForTests,
  resetRateLimitRuntimeForTests,
  hashEmailForRateLimit,
  authLoginEmailKey,
  authPublicFormEmailKey,
  apiKeyRpmKey,
  integrationOrgProviderKey,
} = rl;

const {
  checkLoginThrottle,
  checkSignupThrottle,
  checkPasswordResetThrottle,
  checkPublicFormThrottle,
  checkPortalLoginThrottle,
} = loginThrottle;

const { checkApiRateLimit, getRateLimitForPlan } = apiLimits;
const { checkIntegrationRateLimit, getRateLimitForProvider } = integrationLimits;

function sha256(email) {
  return createHash("sha256").update(email.trim().toLowerCase(), "utf8").digest("hex");
}

beforeEach(() => {
  resetRateLimitRuntimeForTests();
  setRateLimitStoreForTests(createMemoryRateLimitStore());
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.VERCEL;
  delete process.env.E2E_DISABLE_RATE_LIMIT;
});

afterEach(() => {
  resetRateLimitRuntimeForTests();
});

describe("A shared-store semantics", () => {
  it("allows up to limit then denies within the window", async () => {
    const key = "test:bucket:a";
    for (let i = 0; i < 3; i += 1) {
      const r = await checkSlidingWindowRateLimit({ key, limit: 3, windowMs: 60_000, bucketClass: "test" });
      assert.equal(r.allowed, true);
    }
    const denied = await checkSlidingWindowRateLimit({ key, limit: 3, windowMs: 60_000, bucketClass: "test" });
    assert.equal(denied.allowed, false);
    assert.equal(denied.reason, "rate_limit_exceeded");
    assert.ok(denied.retryAfterSeconds >= 1);
  });
});

describe("B production fail matrix", () => {
  it("fail_closed denies when store reports backend unavailable", async () => {
    setRateLimitStoreForTests({
      async checkSlidingWindow(input) {
        return {
          allowed: false,
          limit: input.limit,
          remaining: 0,
          retryAfterSeconds: 30,
          backendUnavailable: true,
          reason: "backend_unavailable",
        };
      },
    });
    const closed = await checkSlidingWindowRateLimit({
      key: "x",
      limit: 1,
      failurePolicy: "fail_closed",
      bucketClass: "test",
    });
    assert.equal(closed.allowed, false);
    assert.equal(closed.backendUnavailable, true);

    const opened = await checkSlidingWindowRateLimit({
      key: "y",
      limit: 1,
      failurePolicy: "fail_open",
      bucketClass: "test",
    });
    assert.equal(opened.allowed, true);
    assert.equal(opened.backendUnavailable, true);
  });

  it("production without Redis uses unavailable store", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    resetRateLimitRuntimeForTests();
    const result = await checkSlidingWindowRateLimit({
      key: "prod-missing-redis",
      limit: 5,
      failurePolicy: "fail_closed",
      bucketClass: "test",
    });
    assert.equal(result.allowed, false);
    assert.equal(result.backendUnavailable, true);
    process.env.NODE_ENV = prev;
    resetRateLimitRuntimeForTests();
    setRateLimitStoreForTests(createMemoryRateLimitStore());
  });
});

describe("C hashed login keys", () => {
  it("hashes normalized email and never embeds plaintext", () => {
    const email = "  Admin@Example.COM ";
    const hash = hashEmailForRateLimit(email);
    assert.equal(hash, sha256("admin@example.com"));
    const key = authLoginEmailKey(email);
    assert.equal(key, `auth:login:email:${hash}`);
    assert.ok(!key.toLowerCase().includes("admin@example.com"));
    assert.match(key, /^auth:login:email:[a-f0-9]{64}$/);
  });
});

describe("D portal login throttle", () => {
  it("throttles portal login after 10 attempts per 15m", async () => {
    const email = "portal-user@example.com";
    for (let i = 0; i < 10; i += 1) {
      const r = await checkPortalLoginThrottle(email);
      assert.equal(r.allowed, true, `attempt ${i + 1}`);
    }
    const denied = await checkPortalLoginThrottle(email);
    assert.equal(denied.allowed, false);
    const portal = readSource("src/lib/client-portal/actions.ts");
    assert.match(portal, /checkPortalLoginThrottle/);
    assert.match(portal, /authThrottleUserMessage/);
  });
});

describe("E signup reset forms", () => {
  it("signup allows 5 per hour then denies", async () => {
    const email = "signup@example.com";
    for (let i = 0; i < 5; i += 1) {
      assert.equal((await checkSignupThrottle(email)).allowed, true);
    }
    assert.equal((await checkSignupThrottle(email)).allowed, false);
  });

  it("password reset enforces 30s cooldown", async () => {
    const email = "reset@example.com";
    assert.equal((await checkPasswordResetThrottle(email)).allowed, true);
    assert.equal((await checkPasswordResetThrottle(email)).allowed, false);
  });

  it("public forms namespace by route", async () => {
    const email = "forms@example.com";
    for (let i = 0; i < 8; i += 1) {
      assert.equal((await checkPublicFormThrottle(email, "contact")).allowed, true);
    }
    assert.equal((await checkPublicFormThrottle(email, "contact")).allowed, false);
    assert.equal((await checkPublicFormThrottle(email, "pilot")).allowed, true);
    assert.equal(authPublicFormEmailKey("contact", email).includes("contact"), true);
  });
});

describe("F API plan RPM", () => {
  it("preserves exact plan RPM values", () => {
    assert.equal(getRateLimitForPlan("starter"), 30);
    assert.equal(getRateLimitForPlan("professional"), 60);
    assert.equal(getRateLimitForPlan("business"), 120);
    assert.equal(getRateLimitForPlan("enterprise"), 300);
  });

  it("rate-limits by apiKeyId with starter 30 RPM", async () => {
    const apiKeyId = "key-starter-1";
    for (let i = 0; i < 30; i += 1) {
      const r = await checkApiRateLimit({ apiKeyId, planKey: "starter" });
      assert.equal(r.allowed, true, `req ${i + 1}`);
    }
    const denied = await checkApiRateLimit({ apiKeyId, planKey: "starter" });
    assert.equal(denied.allowed, false);
    assert.equal(denied.limit, 30);
    assert.equal(apiKeyRpmKey(apiKeyId), `api:key:${apiKeyId}:rpm`);
  });

  it("handler preserves 429 Retry-After and X-RateLimit headers", () => {
    const handler = readSource("src/lib/api/middleware/handler.ts");
    const json = readSource("src/lib/api/responses/json.ts");
    assert.match(handler, /await checkApiRateLimit/);
    assert.match(handler, /apiRateLimited/);
    assert.match(handler, /X-RateLimit-Limit/);
    assert.match(handler, /X-RateLimit-Remaining/);
    assert.match(json, /Retry-After/);
    assert.match(json, /rate_limit_exceeded/);
  });
});

describe("G multi-instance simulation", () => {
  it("two consumers sharing one fake store cannot multiply limits", async () => {
    const shared = createMemoryRateLimitStore();
    setRateLimitStoreForTests(shared);

    async function consumer(label) {
      const results = [];
      for (let i = 0; i < 6; i += 1) {
        results.push(
          await checkSlidingWindowRateLimit({
            key: "shared:multi-instance",
            limit: 5,
            windowMs: 60_000,
            bucketClass: label,
          }),
        );
      }
      return results;
    }

    const [a, b] = await Promise.all([consumer("instance-a"), consumer("instance-b")]);
    const allowed = [...a, ...b].filter((r) => r.allowed).length;
    const denied = [...a, ...b].filter((r) => !r.allowed).length;
    assert.equal(allowed, 5, "exactly 5 allows across both consumers");
    assert.equal(denied, 7, "remaining attempts denied");
  });
});

describe("H multi-tenant isolation", () => {
  it("org A integration limit does not consume org B bucket", async () => {
    assert.equal(getRateLimitForProvider("slack"), 30);
    for (let i = 0; i < 30; i += 1) {
      assert.equal((await checkIntegrationRateLimit("org-a", "slack")).allowed, true);
    }
    assert.equal((await checkIntegrationRateLimit("org-a", "slack")).allowed, false);
    assert.equal((await checkIntegrationRateLimit("org-b", "slack")).allowed, true);
    assert.ok(integrationOrgProviderKey("org-a", "slack").includes("org-a"));
    assert.ok(!integrationOrgProviderKey("org-a", "slack").includes("org-b"));
  });

  it("login throttle isolates distinct emails", async () => {
    for (let i = 0; i < 10; i += 1) {
      assert.equal((await checkLoginThrottle("a@example.com")).allowed, true);
    }
    assert.equal((await checkLoginThrottle("a@example.com")).allowed, false);
    assert.equal((await checkLoginThrottle("b@example.com")).allowed, true);
  });
});

describe("source contracts architecture", () => {
  it("uses rate-limit folder index (old file removed)", () => {
    assert.equal(pathExists("src/lib/security/rate-limit.ts"), false);
    assert.equal(pathExists("src/lib/security/rate-limit/index.ts"), true);
    assert.equal(pathExists("src/lib/security/rate-limit/redis-store.ts"), true);
    assert.equal(pathExists("src/lib/security/rate-limit/memory-store.ts"), true);
  });

  it("env example documents Upstash server-only vars", () => {
    const env = readSource(".env.example");
    assert.match(env, /UPSTASH_REDIS_REST_URL/);
    assert.match(env, /UPSTASH_REDIS_REST_TOKEN/);
    assert.match(env, /never NEXT_PUBLIC_/);
  });

  it("health fail_open; ready/status untouched; mollie/cron free of redis", () => {
    const health = readSource("src/app/api/health/route.ts");
    assert.match(health, /fail_open/);
    assert.match(health, /await checkSlidingWindowRateLimit/);
    const ready = readSource("src/app/api/ready/route.ts");
    const status = readSource("src/app/api/status/route.ts");
    assert.doesNotMatch(ready, /rate-limit|Upstash|checkSlidingWindow/);
    assert.doesNotMatch(status, /rate-limit|Upstash|checkSlidingWindow/);
    const mollie = readSource("src/app/api/mollie/webhook/route.ts");
    const cron = readSource("src/app/api/cron/run/route.ts");
    assert.doesNotMatch(mollie, /upstash|checkSlidingWindowRateLimit/i);
    assert.doesNotMatch(cron, /upstash|checkSlidingWindowRateLimit/i);
  });

  it("openai DB limiter untouched", () => {
    const openai = readSource("src/lib/ai/openai/rate-limit.ts");
    assert.doesNotMatch(openai, /@upstash|checkSlidingWindowRateLimit/);
  });
});

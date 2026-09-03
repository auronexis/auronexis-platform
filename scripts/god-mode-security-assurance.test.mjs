/**
 * God-Mode security assurance — source-contract regressions for the 2026-09-03 pass.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readSource, pathExists } from "./_test-helpers/read-source.mjs";

const SELF_UPDATE_LOCK =
  "supabase/migrations/20260903160000_users_self_update_privilege_lock.sql";

describe("users self-update privilege lock", () => {
  it("replaces users_update_self so role and organization_id cannot be self-mutated", () => {
    assert.equal(pathExists(SELF_UPDATE_LOCK), true);
    const sql = readSource(SELF_UPDATE_LOCK);
    assert.match(sql, /DROP POLICY IF EXISTS users_update_self ON public\.users/);
    assert.match(sql, /CREATE POLICY users_update_self/);
    assert.match(sql, /organization_id = public\.current_organization_id\(\)/);
    assert.match(sql, /role = public\.current_user_role\(\)/);
    assert.match(sql, /is_disabled = FALSE/);
    assert.match(sql, /auth_user_id = auth\.uid\(\)/);
    assert.doesNotMatch(sql, /WITH CHECK \(\s*auth_user_id = auth\.uid\(\)\s*\)/);
    assert.match(sql, /ALTER TABLE public\.sales_invoice_number_counters ENABLE ROW LEVEL SECURITY/);
  });

  it("ships the semantic privilege-lock regression suite", () => {
    assert.equal(pathExists("scripts/users-self-update-privilege-lock.test.mjs"), true);
  });
});

describe("cron and IndexNow fail closed", () => {
  it("requires Bearer CRON_SECRET outside development", () => {
    const env = readSource("src/lib/env.ts");
    assert.match(env, /export function verifyCronAuthorization/);
    assert.match(env, /timingSafeEqualString/);
    assert.match(env, /return process\.env\.NODE_ENV === "development"/);

    const cron = readSource("src/app/api/cron/run/route.ts");
    assert.match(cron, /verifyCronAuthorization/);
    assert.match(cron, /status: 401/);

    const indexNow = readSource("src/app/api/indexnow/route.ts");
    assert.match(indexNow, /verifyCronAuthorization/);
    assert.match(indexNow, /status: 401/);
  });
});

describe("cache isolation", () => {
  it("does not use force-cache or unstable_cache on application loaders", () => {
    const session = readSource("src/lib/auth/session.ts");
    const portal = readSource("src/lib/client-portal/session.ts");
    assert.doesNotMatch(session, /force-cache|unstable_cache/);
    assert.doesNotMatch(portal, /force-cache|unstable_cache/);
  });
});

const PORTAL_SELF_UPDATE_LOCK =
  "supabase/migrations/20260903170000_portal_self_update_tenant_lock.sql";

describe("portal self-update tenant lock", () => {
  it("pins organization_id and client_id on portal self-update", () => {
    assert.equal(pathExists(PORTAL_SELF_UPDATE_LOCK), true);
    const sql = readSource(PORTAL_SELF_UPDATE_LOCK);
    assert.match(sql, /DROP POLICY IF EXISTS client_portal_users_update_self_login/);
    assert.match(sql, /organization_id = public\.current_portal_organization_id\(\)/);
    assert.match(sql, /client_id = public\.current_portal_client_id\(\)/);
  });
});

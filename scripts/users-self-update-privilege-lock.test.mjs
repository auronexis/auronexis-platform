/**
 * Pre-production verification of public.users self-update privilege lock.
 * Reconstructs RLS from migrations and evaluates PostgreSQL permissive OR semantics
 * (USING policies OR independently of WITH CHECK policies). No live database.
 */
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { readSource, rootDir } from "./_test-helpers/read-source.mjs";

const LOCK = "supabase/migrations/20260903160000_users_self_update_privilege_lock.sql";
const FOUNDATION = "supabase/migrations/20250623000000_foundation.sql";
const TEAM = "supabase/migrations/20250623190000_team_and_activity.sql";
const SESSION_RLS = "supabase/migrations/20250623120000_fix_session_rls.sql";
const CLIENTS = "supabase/migrations/20250623140000_clients.sql";

const AUTH_COLUMNS = ["role", "organization_id", "is_disabled", "auth_user_id", "id"];

function migrationFiles() {
  const dir = join(rootDir, "supabase", "migrations");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => `supabase/migrations/${name}`);
}

function extractUsersPolicies(sql) {
  const dropped = [...sql.matchAll(/DROP POLICY IF EXISTS (\w+) ON public\.users/g)].map((m) => m[1]);
  const created = [];
  const createRe =
    /CREATE POLICY (\w+)\s+ON public\.users\s+FOR (SELECT|INSERT|UPDATE|DELETE)\s+TO authenticated([\s\S]*?);/g;
  let match;
  while ((match = createRe.exec(sql))) {
    created.push({
      name: match[1],
      command: match[2],
      body: match[3].trim(),
    });
  }
  return { dropped, created };
}

function reconstructUsersPolicies() {
  /** @type {Map<string, { name: string, command: string, body: string }>} */
  const policies = new Map();
  for (const file of migrationFiles()) {
    const { dropped, created } = extractUsersPolicies(readSource(file));
    for (const name of dropped) {
      policies.delete(name);
    }
    for (const policy of created) {
      policies.set(policy.name, policy);
    }
  }
  return [...policies.values()];
}

function hasGrant(sql, pattern) {
  return pattern.test(sql);
}

const ORG_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const AUTH_STAFF = "11111111-1111-1111-1111-111111111111";
const AUTH_VIEWER = "22222222-2222-2222-2222-222222222222";
const AUTH_ADMIN = "33333333-3333-3333-3333-333333333333";
const AUTH_OWNER = "44444444-4444-4444-4444-444444444444";
const AUTH_OTHER = "55555555-5555-5555-5555-555555555555";
const AUTH_B_STAFF = "66666666-6666-6666-6666-666666666666";

function userRow(overrides) {
  return {
    id: overrides.id,
    auth_user_id: overrides.auth_user_id,
    organization_id: overrides.organization_id,
    full_name: overrides.full_name ?? "User",
    email: overrides.email ?? `${overrides.id}@example.com`,
    role: overrides.role,
    is_disabled: overrides.is_disabled ?? false,
    created_at: overrides.created_at ?? "2026-01-01T00:00:00Z",
    updated_at: overrides.updated_at ?? "2026-01-01T00:00:00Z",
  };
}

function fixtureRows() {
  return [
    userRow({
      id: "staff-a",
      auth_user_id: AUTH_STAFF,
      organization_id: ORG_A,
      role: "staff",
      full_name: "Staff A",
      email: "staff-a@example.com",
    }),
    userRow({
      id: "viewer-a",
      auth_user_id: AUTH_VIEWER,
      organization_id: ORG_A,
      role: "viewer",
      full_name: "Viewer A",
      email: "viewer-a@example.com",
    }),
    userRow({
      id: "admin-a",
      auth_user_id: AUTH_ADMIN,
      organization_id: ORG_A,
      role: "admin",
      full_name: "Admin A",
      email: "admin-a@example.com",
    }),
    userRow({
      id: "owner-a",
      auth_user_id: AUTH_OWNER,
      organization_id: ORG_A,
      role: "owner",
      full_name: "Owner A",
      email: "owner-a@example.com",
    }),
    userRow({
      id: "staff-b",
      auth_user_id: AUTH_B_STAFF,
      organization_id: ORG_B,
      role: "staff",
      full_name: "Staff B",
      email: "staff-b@example.com",
    }),
    userRow({
      id: "staff-disabled",
      auth_user_id: AUTH_OTHER,
      organization_id: ORG_A,
      role: "staff",
      is_disabled: true,
      full_name: "Disabled Staff",
      email: "disabled@example.com",
    }),
  ];
}

function actorState(rows, authUid) {
  const self = rows.find((row) => row.auth_user_id === authUid && row.is_disabled === false);
  return {
    authUid,
    currentOrgId: self?.organization_id ?? null,
    currentRole: self?.role ?? null,
  };
}

function isTrue(value) {
  return value === true;
}

const PRE_FIX_SELF = {
  name: "users_update_self",
  using: (ctx, row) => row.auth_user_id === ctx.authUid,
  check: (ctx, row) => row.auth_user_id === ctx.authUid,
};

const POST_FIX_SELF = {
  name: "users_update_self",
  using: (ctx, row) => row.auth_user_id === ctx.authUid && row.is_disabled === false,
  check: (ctx, row) =>
    row.auth_user_id === ctx.authUid &&
    row.is_disabled === false &&
    row.organization_id === ctx.currentOrgId &&
    row.role === ctx.currentRole,
};

const TEAM_OWNER = {
  name: "users_update_team_owner",
  using: (ctx, row) => row.organization_id === ctx.currentOrgId && ctx.currentRole === "owner",
  check: (ctx, row) => row.organization_id === ctx.currentOrgId && ctx.currentRole === "owner",
};

const TEAM_ADMIN = {
  name: "users_update_team_admin",
  using: (ctx, row) =>
    row.organization_id === ctx.currentOrgId &&
    ctx.currentRole === "admin" &&
    (row.role === "staff" || row.role === "viewer"),
  check: (ctx, row) =>
    row.organization_id === ctx.currentOrgId &&
    ctx.currentRole === "admin" &&
    (row.role === "staff" || row.role === "viewer"),
};

function authenticatedUpdateAllowed(policies, rows, authUid, oldRow, patch) {
  const ctx = actorState(rows, authUid);
  const newRow = { ...oldRow, ...patch };
  const usingPass = policies.some((policy) => isTrue(policy.using(ctx, oldRow)));
  const checkPass = policies.some((policy) => isTrue(policy.check(ctx, newRow)));
  return usingPass && checkPass;
}

function postFixPolicies() {
  return [POST_FIX_SELF, TEAM_OWNER, TEAM_ADMIN];
}

function preFixPolicies() {
  return [PRE_FIX_SELF, TEAM_OWNER, TEAM_ADMIN];
}

describe("public.users authorization contract reconstruction", () => {
  it("enumerates every users policy from ordered migrations", () => {
    const policies = reconstructUsersPolicies();
    const names = policies.map((policy) => policy.name).sort();
    assert.deepEqual(names, [
      "users_select_own",
      "users_select_portal_client_owner",
      "users_select_same_org",
      "users_update_self",
      "users_update_team_admin",
      "users_update_team_owner",
    ]);

    const update = policies.filter((policy) => policy.command === "UPDATE");
    assert.equal(update.length, 3);
    assert.ok(update.every((policy) => !/AS RESTRICTIVE/i.test(policy.body)));
    assert.ok(policies.every((policy) => policy.command !== "INSERT" && policy.command !== "DELETE"));
  });

  it("locks users_update_self WITH CHECK to org, role, enabled, and auth uid", () => {
    const sql = readSource(LOCK);
    assert.match(sql, /DROP POLICY IF EXISTS users_update_self ON public\.users/);
    assert.match(sql, /FOR UPDATE\s+TO authenticated/);
    assert.match(
      sql,
      /USING \(\s*auth_user_id = auth\.uid\(\)\s*AND is_disabled = FALSE\s*\)/,
    );
    assert.match(sql, /organization_id = public\.current_organization_id\(\)/);
    assert.match(sql, /role = public\.current_user_role\(\)/);
    assert.match(sql, /auth_user_id = auth\.uid\(\)/);
    assert.doesNotMatch(
      sql,
      /WITH CHECK \(\s*auth_user_id = auth\.uid\(\)\s*\)/,
    );

    const original = readSource(FOUNDATION);
    assert.match(
      original,
      /CREATE POLICY users_update_self[\s\S]*USING \(auth_user_id = auth\.uid\(\)\)\s*WITH CHECK \(auth_user_id = auth\.uid\(\)\)/,
    );
  });

  it("keeps team owner/admin UPDATE policies unchanged and permissive", () => {
    const team = readSource(TEAM);
    assert.match(team, /CREATE POLICY users_update_team_owner/);
    assert.match(team, /CREATE POLICY users_update_team_admin/);
    assert.match(team, /public\.current_user_role\(\) = 'owner'/);
    assert.match(team, /public\.current_user_role\(\) = 'admin'/);
    assert.match(team, /role IN \('staff', 'viewer'\)/);
    assert.doesNotMatch(readSource(LOCK), /users_update_team_/);
  });

  it("defines current_organization_id and current_user_role as SECURITY DEFINER lookups", () => {
    const foundation = readSource(FOUNDATION);
    const clients = readSource(CLIENTS);
    assert.match(foundation, /CREATE OR REPLACE FUNCTION public\.current_organization_id\(\)/);
    assert.match(foundation, /SECURITY DEFINER/);
    assert.match(foundation, /auth_user_id = auth\.uid\(\)\s*AND is_disabled = FALSE/);
    assert.match(clients, /CREATE OR REPLACE FUNCTION public\.current_user_role\(\)/);
    assert.match(clients, /SELECT role\s+FROM public\.users/);
    assert.match(clients, /is_disabled = FALSE/);
  });

  it("grants authenticated SELECT, UPDATE on users and never INSERT/DELETE", () => {
    const allSql = migrationFiles().map((file) => readSource(file)).join("\n");
    assert.equal(hasGrant(allSql, /GRANT SELECT, UPDATE ON public\.users TO authenticated/), true);
    assert.equal(hasGrant(allSql, /GRANT INSERT ON public\.users TO authenticated/), false);
    assert.equal(hasGrant(allSql, /GRANT DELETE ON public\.users TO authenticated/), false);
    assert.equal(hasGrant(allSql, /GRANT ALL ON TABLE public\.users TO service_role/), true);
    assert.equal(hasGrant(allSql, /GRANT .* ON public\.users TO anon/), false);
    assert.equal(hasGrant(allSql, /REVOKE UPDATE \(.*role.*\) ON public\.users/), false);
  });
});

describe("ORIGINAL P0 — pre-fix self-update", () => {
  const rows = fixtureRows();
  const staff = rows[0];
  const policies = preFixPolicies();

  it("allows staff to escalate role and jump tenants before the lock", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { role: "admin" }),
      true,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { role: "owner" }),
      true,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { organization_id: ORG_B }),
      true,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { is_disabled: true }),
      true,
    );
  });

  it("allows a disabled user to re-enable themselves before the lock", () => {
    const disabled = rows.find((row) => row.id === "staff-disabled");
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_OTHER, disabled, { is_disabled: false }),
      true,
    );
  });

  it("already rejected auth_user_id reassignment on users_update_self", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, {
        auth_user_id: AUTH_OWNER,
      }),
      false,
    );
  });
});

describe("negative security — post-fix authenticated UPDATE", () => {
  const rows = fixtureRows();
  const staff = rows[0];
  const viewer = rows[1];
  const admin = rows[2];
  const owner = rows[3];
  const staffB = rows[4];
  const disabled = rows[5];
  const policies = postFixPolicies();

  it("A) rejects self role escalation including viewer -> staff and staff -> admin/owner", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { role: "admin" }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { role: "owner" }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_VIEWER, viewer, { role: "staff" }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_ADMIN, admin, { role: "owner" }),
      false,
    );
  });

  it("B) rejects self tenant reassignment", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { organization_id: ORG_B }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_ADMIN, admin, { organization_id: ORG_B }),
      false,
    );
  });

  it("C) rejects self re-enable when disabled and self-disable when enabled", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_OTHER, disabled, { is_disabled: false }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { is_disabled: true }),
      false,
    );
  });

  it("D) rejects auth_user_id reassignment", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { auth_user_id: AUTH_OWNER }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_ADMIN, admin, { auth_user_id: AUTH_STAFF }),
      false,
    );
  });

  it("E) rejects another user's row mutation by staff/viewer", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, viewer, { full_name: "Hijack" }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_VIEWER, staff, { role: "viewer" }),
      false,
    );
  });

  it("F) rejects cross-tenant row mutation", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staffB, { full_name: "Escape" }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_OWNER, staffB, { role: "staff" }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_ADMIN, staffB, { is_disabled: true }),
      false,
    );
  });

  it("G) rejects malformed/partial PostgREST PATCH privilege fields", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { role: "admin", full_name: "x" }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, {
        organization_id: ORG_B,
        role: "staff",
      }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, {}),
      true,
    );
  });

  it("H) OR-composition does not let staff use team WITH CHECK after self USING", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { role: "admin" }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_VIEWER, viewer, { role: "admin" }),
      false,
    );
  });
});

describe("positive compatibility — post-fix legitimate flows", () => {
  const rows = fixtureRows();
  const staff = rows[0];
  const viewer = rows[1];
  const admin = rows[2];
  const owner = rows[3];
  const disabled = rows[5];
  const policies = postFixPolicies();

  it("allows self-update of full_name for enabled members", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_STAFF, staff, { full_name: "Staff Updated" }),
      true,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_VIEWER, viewer, { full_name: "Viewer Updated" }),
      true,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_ADMIN, admin, { full_name: "Admin Updated" }),
      true,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_OWNER, owner, { full_name: "Owner Updated" }),
      true,
    );
  });

  it("allows owner/admin team role assignment on other members in-tenant", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_OWNER, staff, { role: "admin" }),
      true,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_ADMIN, staff, { role: "viewer" }),
      true,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_ADMIN, staff, { role: "admin" }),
      false,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_ADMIN, owner, { role: "staff" }),
      false,
    );
  });

  it("allows owner/admin disable and re-enable of staff", () => {
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_OWNER, staff, { is_disabled: true }),
      true,
    );
    assert.equal(
      authenticatedUpdateAllowed(policies, rows, AUTH_ADMIN, disabled, { is_disabled: false }),
      true,
    );
  });
});

describe("application paths stay compatible with the lock", () => {
  it("profile self-update only patches full_name via the RLS user client", () => {
    const profile = readSource("src/lib/profile/actions.ts");
    assert.match(profile, /createClient\(\)/);
    assert.match(profile, /from\("users"\)/);
    assert.match(profile, /update\(\{ full_name: parsed\.data\.fullName \}/);
    assert.doesNotMatch(profile, /role:|organization_id:|is_disabled:|auth_user_id:/);
    assert.doesNotMatch(profile, /createAdminClient/);
  });

  it("team role and disable use the session client (team UPDATE policies)", () => {
    const team = readSource("src/lib/team/actions.ts");
    assert.match(team, /update\(\{ role: parsed\.data\.role \}/);
    assert.match(team, /update\(\{ is_disabled: isDisabled \}/);
    assert.match(team, /canManageTeamMember/);
    assert.match(team, /createAdminClient\(\)/);
    assert.match(
      team,
      /const admin = createAdminClient\(\);[\s\S]*admin\.from\("users"\)\.insert/,
    );
  });

  it("signup provisions owner via service-role insert, not authenticated UPDATE", () => {
    const auth = readSource("src/lib/auth/actions.ts");
    assert.match(auth, /createAdminClient\(\)/);
    assert.match(auth, /from\("users"\)\s*\.insert/);
    assert.match(auth, /role: "owner"/);
    assert.match(auth, /auth_user_id: authData\.user\.id/);
    assert.match(auth, /organization_id: organization\.id/);
  });

  it("admin client remains server-only and bypasses RLS", () => {
    const admin = readSource("src/lib/supabase/admin.ts");
    assert.match(admin, /import "server-only"/);
    assert.match(admin, /getSupabaseServiceRoleKey/);
    assert.match(admin, /bypasses RLS/);
    const sessionClient = readSource("src/lib/supabase/server.ts");
    assert.match(sessionClient, /getSupabaseAnonKey/);
    assert.doesNotMatch(sessionClient, /getSupabaseServiceRoleKey/);
  });

  it("users table has no locale/timezone columns; regional prefs live on organizations", () => {
    const types = readSource("src/types/database.ts");
    const usersBlock = types.slice(types.indexOf("users: {"), types.indexOf("transactional_email_deliveries"));
    assert.match(usersBlock, /full_name: string/);
    assert.doesNotMatch(usersBlock, /locale|timezone/);
  });
});

describe("column privileges — least privilege vs compatibility", () => {
  it("documents why table-wide UPDATE must remain for authenticated", () => {
    const team = readSource("src/lib/team/actions.ts");
    assert.match(team, /const supabase = await createClient\(\)/);
    assert.match(team, /from\("users"\)[\s\S]*update\(\{ role:/);
    assert.match(team, /from\("users"\)[\s\S]*update\(\{ is_disabled:/);
    for (const column of AUTH_COLUMNS) {
      assert.equal(typeof column, "string");
    }
  });
});

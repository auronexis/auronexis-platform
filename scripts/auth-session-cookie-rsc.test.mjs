/**
 * Auth session cookie contracts — Server Components must not mutate cookies during GET render.
 * Session refresh belongs in middleware; auth mutations use createWritableClient in actions/routes.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { readSource } from "./_test-helpers/read-source.mjs";

test("readSessionContext does not write cookies during RSC render", () => {
  const session = readSource("src/lib/auth/session.ts");
  const readBlock = session.slice(
    session.indexOf("export async function readSessionContext"),
    session.indexOf("export async function readSessionContextFromRequest"),
  );

  assert.doesNotMatch(readBlock, /cookieStore\.set/);
  assert.doesNotMatch(readBlock, /setAllCookies/);
  assert.match(readBlock, /loadSessionContext\(\(\) => cookieStore\.getAll\(\)\)/);
});

test("default Supabase server client is read-only in Server Components", () => {
  const server = readSource("src/lib/supabase/server.ts");

  assert.match(server, /export async function createClient\(\)/);
  assert.match(server, /createSupabaseServerClient\(false\)/);
  assert.match(server, /if \(!writable\)/);
  assert.doesNotMatch(server, /try\s*\{/);
});

test("writable Supabase client is reserved for auth mutations", () => {
  const server = readSource("src/lib/supabase/server.ts");
  assert.match(server, /export async function createWritableClient\(\)/);
  assert.match(server, /createSupabaseServerClient\(true\)/);

  for (const path of [
    "src/app/auth/callback/route.ts",
    "src/lib/auth/actions.ts",
    "src/lib/auth/reset-actions.ts",
    "src/lib/client-portal/actions.ts",
    "src/lib/profile/actions.ts",
    "src/lib/team/actions.ts",
  ]) {
    const source = readSource(path);
    assert.match(
      source,
      /createWritableClient/,
      `${path} must use createWritableClient for auth cookie mutations`,
    );
  }
});

test("middleware retains writable session refresh adapter", () => {
  const middleware = readSource("src/lib/supabase/middleware.ts");
  assert.match(middleware, /setAll\(cookiesToSet/);
  assert.match(middleware, /supabaseResponse\.cookies\.set/);
  assert.match(middleware, /await supabase\.auth\.getUser\(\)/);
});

test("reset-password exchanges recovery codes via auth callback route", () => {
  const page = readSource("src/app/(auth)/reset-password/page.tsx");
  const resetSession = readSource("src/lib/auth/reset-session.ts");

  assert.match(page, /params\.code/);
  assert.match(page, /\/auth\/callback\?code=/);
  assert.doesNotMatch(resetSession, /exchangeCodeForSession/);
});

test("settings diagnostics uses read-only session helpers", () => {
  const page = readSource("src/app/(dashboard)/settings/diagnostics/page.tsx");
  assert.match(page, /requireSession/);
  assert.doesNotMatch(page, /createWritableClient/);
  assert.doesNotMatch(page, /cookieStore\.set/);
});

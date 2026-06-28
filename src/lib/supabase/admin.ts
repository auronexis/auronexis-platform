import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return input.url;
}

/**
 * PostgREST requests must authenticate secret keys via the `apikey` header only.
 * New `sb_secret_*` keys are not JWTs — `Authorization: Bearer sb_secret_...`
 * prevents the service role from bypassing RLS (inserts fail silently as anon).
 */
function isPostgrestRequest(input: RequestInfo | URL): boolean {
  return getRequestUrl(input).includes("/rest/v1/");
}

/**
 * Admin Supabase client — bypasses RLS.
 * Use only in trusted Server Actions (org bootstrap, invites).
 */
export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);

        if (isPostgrestRequest(input)) {
          headers.delete("Authorization");
        }

        return fetch(input, { ...init, headers });
      },
    },
  });
}

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function buildCookieHandlers(cookieStore: CookieStore, writable: boolean) {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
      if (!writable) {
        return;
      }
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    },
  };
}

async function createSupabaseServerClient(writable: boolean) {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: buildCookieHandlers(cookieStore, writable),
  });
}

/**
 * Server Supabase client — respects RLS via user session cookies.
 * Read-only cookie adapter: session refresh runs in middleware, not during RSC render.
 */
export async function createClient() {
  return createSupabaseServerClient(false);
}

/** Writable cookie adapter — route handlers and Server Actions that establish or clear auth. */
export async function createWritableClient() {
  return createSupabaseServerClient(true);
}

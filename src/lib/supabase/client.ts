import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/** Browser Supabase client — use in Client Components only. */
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}

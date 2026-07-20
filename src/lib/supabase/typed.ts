import type { Database, TablesInsert, TablesUpdate } from "@/types/database";

/**
 * Accepts both SSR (`@supabase/ssr`) and JS (`@supabase/supabase-js`) clients.
 * Schema generics differ slightly between packages; keep this boundary loose.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabaseClient = any;

/**
 * Typed insert helper — prefer over scattered `as never` on insert payloads.
 * Casts once at the boundary when generated Insert types disagree with client inference.
 */
export function insertRows<T extends keyof Database["public"]["Tables"]>(
  client: LooseSupabaseClient,
  table: T,
  rows: TablesInsert<T> | TablesInsert<T>[],
) {
  return client.from(table).insert(rows as never);
}

/**
 * Typed update helper — prefer over scattered `as never` on update payloads.
 */
export function updateRows<T extends keyof Database["public"]["Tables"]>(
  client: LooseSupabaseClient,
  table: T,
  patch: TablesUpdate<T>,
) {
  return client.from(table).update(patch as never);
}

/**
 * Typed upsert helper — prefer over scattered `as never` on upsert payloads.
 */
export function upsertRows<T extends keyof Database["public"]["Tables"]>(
  client: LooseSupabaseClient,
  table: T,
  rows: TablesInsert<T> | TablesInsert<T>[],
  options?: { onConflict?: string; ignoreDuplicates?: boolean },
) {
  return client.from(table).upsert(rows as never, options);
}

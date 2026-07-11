import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { PostgrestError } from "@supabase/supabase-js";

export type AdoptionPrefsUpdate =
  Database["public"]["Tables"]["organization_adoption_preferences"]["Update"];

export type AdoptionPrefsInsert =
  Database["public"]["Tables"]["organization_adoption_preferences"]["Insert"];

export type AdoptionPrefsRow =
  Database["public"]["Tables"]["organization_adoption_preferences"]["Row"];

export type AdoptionPreferences = {
  lastViewedAt: string | null;
  summaryDismissedAt: string | null;
};

const EMPTY: AdoptionPreferences = {
  lastViewedAt: null,
  summaryDismissedAt: null,
};

function logAdoptionPrefsError(
  operation: "select_existing" | "update" | "insert",
  organizationId: string,
  error: PostgrestError,
): void {
  console.error("[adoption_preferences]", {
    operation,
    organization_id: organizationId,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export async function getAdoptionPreferences(
  organizationId: string,
): Promise<AdoptionPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_adoption_preferences")
    .select("last_viewed_at, summary_dismissed_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return EMPTY;
  }

  const row = data as AdoptionPrefsRow;
  return {
    lastViewedAt: row.last_viewed_at,
    summaryDismissedAt: row.summary_dismissed_at,
  };
}

async function updatePrefs(
  organizationId: string,
  patch: AdoptionPrefsUpdate,
): Promise<PostgrestError | null> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_adoption_preferences")
    .update(patch as never)
    .eq("organization_id", organizationId);
  return error;
}

async function insertPrefs(
  organizationId: string,
  patch: AdoptionPrefsUpdate,
): Promise<PostgrestError | null> {
  const supabase = await createClient();
  const row: AdoptionPrefsInsert = { organization_id: organizationId, ...patch };
  const { error } = await supabase
    .from("organization_adoption_preferences")
    .insert(row as never);
  return error;
}

export async function upsertAdoptionPreferences(
  organizationId: string,
  patch: AdoptionPrefsUpdate,
): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: existing, error: selectError } = await supabase
    .from("organization_adoption_preferences")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (selectError) {
    logAdoptionPrefsError("select_existing", organizationId, selectError);
    return { error: "Unable to save adoption preferences." };
  }

  if (existing) {
    const updateError = await updatePrefs(organizationId, patch);
    if (updateError) {
      logAdoptionPrefsError("update", organizationId, updateError);
      return { error: "Unable to save adoption preferences." };
    }
    return null;
  }

  const insertError = await insertPrefs(organizationId, patch);
  if (!insertError) {
    return null;
  }

  logAdoptionPrefsError("insert", organizationId, insertError);

  if (insertError.code === "23505") {
    const retryError = await updatePrefs(organizationId, patch);
    if (!retryError) {
      return null;
    }
    logAdoptionPrefsError("update", organizationId, retryError);
  }

  return { error: "Unable to save adoption preferences." };
}

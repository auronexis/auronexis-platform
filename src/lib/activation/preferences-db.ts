import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { ActivationPreferences } from "@/lib/activation/types";
import type { PostgrestError } from "@supabase/supabase-js";

export type ActivationPrefsUpdate =
  Database["public"]["Tables"]["organization_activation_preferences"]["Update"];

export type ActivationPrefsInsert =
  Database["public"]["Tables"]["organization_activation_preferences"]["Insert"];

export type ActivationPrefsRow =
  Database["public"]["Tables"]["organization_activation_preferences"]["Row"];

const EMPTY_PREFERENCES: ActivationPreferences = {
  welcomeDismissedAt: null,
  onboardingDismissedAt: null,
  onboardingLastViewedAt: null,
  activationMilestoneReachedAt: null,
  activationPanelDismissedAt: null,
};

function logActivationPrefsError(
  operation: "select_existing" | "update" | "insert",
  organizationId: string,
  error: PostgrestError,
): void {
  console.error("[activation_preferences]", {
    operation,
    organization_id: organizationId,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function mapRow(data: ActivationPrefsRow): ActivationPreferences {
  return {
    welcomeDismissedAt: data.welcome_dismissed_at,
    onboardingDismissedAt: data.onboarding_dismissed_at,
    onboardingLastViewedAt: data.onboarding_last_viewed_at,
    activationMilestoneReachedAt: data.activation_milestone_reached_at,
    activationPanelDismissedAt: data.activation_panel_dismissed_at,
  };
}

export async function getActivationPreferences(
  organizationId: string,
): Promise<ActivationPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_activation_preferences")
    .select(
      "welcome_dismissed_at, onboarding_dismissed_at, onboarding_last_viewed_at, activation_milestone_reached_at, activation_panel_dismissed_at",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return EMPTY_PREFERENCES;
  }

  return mapRow(data as ActivationPrefsRow);
}

async function updateActivationPreferences(
  organizationId: string,
  patch: ActivationPrefsUpdate,
): Promise<PostgrestError | null> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("organization_activation_preferences")
    .update(patch as never)
    .eq("organization_id", organizationId);

  return error;
}

async function insertActivationPreferences(
  organizationId: string,
  patch: ActivationPrefsUpdate,
): Promise<PostgrestError | null> {
  const supabase = await createClient();
  const insertRow: ActivationPrefsInsert = {
    organization_id: organizationId,
    ...patch,
  };

  const { error } = await supabase
    .from("organization_activation_preferences")
    .insert(insertRow as never);

  return error;
}

export async function upsertActivationPreferences(
  organizationId: string,
  patch: ActivationPrefsUpdate,
): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: existing, error: selectError } = await supabase
    .from("organization_activation_preferences")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (selectError) {
    logActivationPrefsError("select_existing", organizationId, selectError);
    return { error: "Unable to save workspace preferences." };
  }

  if (existing) {
    const updateError = await updateActivationPreferences(organizationId, patch);
    if (updateError) {
      logActivationPrefsError("update", organizationId, updateError);
      return { error: "Unable to save workspace preferences." };
    }
    return null;
  }

  const insertError = await insertActivationPreferences(organizationId, patch);
  if (!insertError) {
    return null;
  }

  logActivationPrefsError("insert", organizationId, insertError);

  if (insertError.code === "23505") {
    const retryUpdateError = await updateActivationPreferences(organizationId, patch);
    if (!retryUpdateError) {
      return null;
    }
    logActivationPrefsError("update", organizationId, retryUpdateError);
  }

  return { error: "Unable to save workspace preferences." };
}

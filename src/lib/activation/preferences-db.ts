import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { ActivationPreferences } from "@/lib/activation/types";

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
};

function mapRow(data: ActivationPrefsRow): ActivationPreferences {
  return {
    welcomeDismissedAt: data.welcome_dismissed_at,
    onboardingDismissedAt: data.onboarding_dismissed_at,
    onboardingLastViewedAt: data.onboarding_last_viewed_at,
    activationMilestoneReachedAt: data.activation_milestone_reached_at,
  };
}

export async function getActivationPreferences(
  organizationId: string,
): Promise<ActivationPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_activation_preferences")
    .select(
      "welcome_dismissed_at, onboarding_dismissed_at, onboarding_last_viewed_at, activation_milestone_reached_at",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return EMPTY_PREFERENCES;
  }

  return mapRow(data as ActivationPrefsRow);
}

export async function upsertActivationPreferences(
  organizationId: string,
  patch: ActivationPrefsUpdate,
): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("organization_activation_preferences")
    .select("organization_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("organization_activation_preferences")
      .update(patch as never)
      .eq("organization_id", organizationId);
    if (error) {
      return { error: "Unable to update workspace preferences." };
    }
    return null;
  }

  const insertRow: ActivationPrefsInsert = {
    organization_id: organizationId,
    ...patch,
  };

  const { error } = await supabase
    .from("organization_activation_preferences")
    .insert(insertRow as never);

  if (error) {
    return { error: "Unable to save workspace preferences." };
  }

  return null;
}

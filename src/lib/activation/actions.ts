"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { resolveActionError } from "@/lib/action-errors";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { createClient } from "@/lib/supabase/server";
import {
  upsertActivationPreferences,
  type ActivationPrefsUpdate,
} from "@/lib/activation/preferences-db";
import type { ActivationPrefsRow } from "@/lib/activation/preferences-db";

export type ActivationActionState = {
  error?: string;
  success?: string;
};

const dismissSchema = z.object({
  surface: z.enum(["welcome", "onboarding"]),
});

/** Dismiss welcome or onboarding surfaces for the workspace. */
export async function dismissActivationSurfaceAction(
  _prev: ActivationActionState,
  formData: FormData,
): Promise<ActivationActionState> {
  try {
    const session = await requireSession();
    if (!canManageOrganizationSettings(session)) {
      return { error: "Only workspace owners and admins can update onboarding preferences." };
    }

    const parsed = dismissSchema.safeParse({
      surface: formData.get("surface"),
    });

    if (!parsed.success) {
      return { error: "Invalid request." };
    }

    const now = new Date().toISOString();
    const patch: ActivationPrefsUpdate =
      parsed.data.surface === "welcome"
        ? { welcome_dismissed_at: now }
        : { onboarding_dismissed_at: now };

    const upsertError = await upsertActivationPreferences(session.organization.id, patch);
    if (upsertError) {
      return upsertError;
    }

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    return { success: "Updated workspace preferences." };
  } catch (error) {
    return resolveActionError(error);
  }
}

/** Record onboarding hub visit timestamp. */
export async function recordOnboardingViewAction(): Promise<ActivationActionState> {
  try {
    const session = await requireSession();
    const now = new Date().toISOString();

    const upsertError = await upsertActivationPreferences(session.organization.id, {
      onboarding_last_viewed_at: now,
    });
    if (upsertError) {
      return upsertError;
    }

    revalidatePath("/onboarding");
    return { success: "Recorded." };
  } catch (error) {
    return resolveActionError(error);
  }
}

/** Persist activation panel dismissal for the workspace dashboard. */
export async function dismissActivationPanelAction(): Promise<ActivationActionState> {
  try {
    const session = await requireSession();
    if (!canManageOrganizationSettings(session)) {
      return { error: "Only workspace owners and admins can dismiss the activation panel." };
    }

    const now = new Date().toISOString();
    const upsertError = await upsertActivationPreferences(session.organization.id, {
      activation_panel_dismissed_at: now,
    });
    if (upsertError) {
      return upsertError;
    }

    revalidatePath("/dashboard");
    return { success: "Activation panel dismissed." };
  } catch (error) {
    return resolveActionError(error);
  }
}

/** Persist activation milestone timestamp when first value is reached. */
export async function recordActivationMilestoneAction(): Promise<ActivationActionState> {
  try {
    const session = await requireSession();
    if (!canManageOrganizationSettings(session)) {
      return { error: "Insufficient permissions." };
    }

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("organization_activation_preferences")
      .select("activation_milestone_reached_at")
      .eq("organization_id", session.organization.id)
      .maybeSingle();

    const row = existing as ActivationPrefsRow | null;
    if (row?.activation_milestone_reached_at) {
      return { success: "Already recorded." };
    }

    const now = new Date().toISOString();
    const upsertError = await upsertActivationPreferences(session.organization.id, {
      activation_milestone_reached_at: now,
    });
    if (upsertError) {
      return upsertError;
    }

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    return { success: "Activation milestone recorded." };
  } catch (error) {
    return resolveActionError(error);
  }
}

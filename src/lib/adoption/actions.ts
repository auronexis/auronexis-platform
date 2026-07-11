"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { resolveActionError } from "@/lib/action-errors";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { upsertAdoptionPreferences } from "@/lib/adoption/preferences-db";

export type AdoptionActionResult =
  | { success: true }
  | { success: false; error: string };

/** Record adoption hub page view timestamp. */
export async function recordAdoptionPageViewAction(): Promise<AdoptionActionResult> {
  try {
    const session = await requireSession();
    const now = new Date().toISOString();

    const error = await upsertAdoptionPreferences(session.organization.id, {
      last_viewed_at: now,
    });
    if (error) {
      return { success: false, error: error.error };
    }

    revalidatePath("/adoption");
    return { success: true };
  } catch (err) {
    const resolved = resolveActionError(err);
    return {
      success: false,
      error: resolved.error ?? "Unable to record adoption view.",
    };
  }
}

/** Dismiss compact adoption summary on dashboard (owner/admin). */
export async function dismissAdoptionSummaryAction(): Promise<AdoptionActionResult> {
  try {
    const session = await requireSession();
    if (!canManageOrganizationSettings(session)) {
      return {
        success: false,
        error: "Only workspace owners and admins can dismiss the adoption summary.",
      };
    }

    const now = new Date().toISOString();
    const error = await upsertAdoptionPreferences(session.organization.id, {
      summary_dismissed_at: now,
    });
    if (error) {
      return { success: false, error: error.error };
    }

    revalidatePath("/dashboard");
    revalidatePath("/adoption");
    return { success: true };
  } catch (err) {
    const resolved = resolveActionError(err);
    return {
      success: false,
      error: resolved.error ?? "Unable to save adoption preferences.",
    };
  }
}

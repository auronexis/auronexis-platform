"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const updateAccountSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters."),
});

export type ProfileActionState = {
  error?: string;
  success?: string;
};

/** Update the signed-in user's display name — uses existing users.full_name column and RLS self-update policy. */
export async function updateAccountProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireSession();
  const parsed = updateAccountSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile data." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ full_name: parsed.data.fullName } as never)
    .eq("id", session.user.id)
    .eq("auth_user_id", session.authUserId);

  if (error) {
    return { error: "Unable to update your profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");

  return { success: "Preferences saved." };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/env";
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

const updateEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

async function userHasPasswordProvider(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.identities?.some((identity) => identity.provider === "email") ?? false;
}

/** Request an email change via Supabase auth — confirmation may be required. */
export async function updateAccountEmailAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await requireSession();
  const parsed = updateEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email address." };
  }

  if (parsed.data.email.toLowerCase() === session.email.toLowerCase()) {
    return { error: "This is already your email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email });

  if (error) {
    return { error: "Unable to update email. Please try again or contact support." };
  }

  revalidatePath("/profile");

  return {
    success:
      "Check your inbox to confirm your new email address. Your login email will update after confirmation.",
  };
}

/** Change password for accounts with email/password sign-in. */
export async function changeAccountPasswordAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  await requireSession();
  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const supabase = await createClient();
  const hasPasswordProvider = await userHasPasswordProvider(supabase);

  if (!hasPasswordProvider) {
    return { error: "Password sign-in is not available for this account." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: "Unable to update password. Please try again." };
  }

  return { success: "Your password has been updated." };
}

/** Send a password reset email to the signed-in user's address. */
export async function sendAccountPasswordResetAction(
  _prevState: ProfileActionState,
): Promise<ProfileActionState> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(session.email, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/profile`,
  });

  if (error) {
    return { error: "Unable to send reset email. Please try again." };
  }

  return { success: "Password reset instructions sent to your email." };
}

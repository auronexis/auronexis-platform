"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkLoginThrottle, checkSignupThrottle } from "@/lib/security/login-throttle";
import { isTurnstileConfigured, verifyTurnstileFromForm } from "@/lib/security/turnstile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { slugifyOrganizationName } from "@/lib/tenancy/context";
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Full name is required."),
  organizationName: z.string().min(2, "Organization name is required."),
});

export type AuthActionState = {
  error?: string;
};

/** Sign in with email and password — docs/04 login flow. */
export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials." };
  }

  if (isTurnstileConfigured() || process.env.NODE_ENV === "production") {
    const turnstileOk = await verifyTurnstileFromForm(formData);
    if (!turnstileOk) {
      return { error: "Security verification failed. Please try again." };
    }
  }

  const throttle = checkLoginThrottle(parsed.data.email);
  if (!throttle.allowed) {
    return {
      error: `Too many sign-in attempts. Try again in ${throttle.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  const redirectField = formData.get("redirect");
  const redirectTo = resolveSafeRedirectPath(
    typeof redirectField === "string" ? redirectField : null,
  );
  redirect(redirectTo);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    return { error: "Unable to sign in right now. Please try again." };
  }
}
/**
 * Register a new agency account.
 * Creates auth user, organization, and owner profile via service role.
 */
export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    organizationName: formData.get("organizationName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration data." };
  }

  if (isTurnstileConfigured() || process.env.NODE_ENV === "production") {
    const turnstileOk = await verifyTurnstileFromForm(formData);
    if (!turnstileOk) {
      return { error: "Security verification failed. Please try again." };
    }
  }

  const throttle = checkSignupThrottle(parsed.data.email);
  if (!throttle.allowed) {
    return {
      error: `Too many registration attempts. Try again in ${throttle.retryAfterSeconds} seconds.`,
    };
  }

  const admin = createAdminClient();
  const baseSlug = slugifyOrganizationName(parsed.data.organizationName);
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const isProduction = process.env.NODE_ENV === "production";

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: !isProduction,
    user_metadata: {
      full_name: parsed.data.fullName,
    },
  });

  if (authError || !authData.user) {
    return { error: "Unable to create account. Try a different email or sign in." };
  }

  const { data: organization, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: parsed.data.organizationName,
      slug,
      plan: "free",
    })
    .select("*")
    .single();

  if (orgError || !organization) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Unable to create organization." };
  }
  const { error: profileError } = await admin.from("users").insert({
    auth_user_id: authData.user.id,
    organization_id: organization.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    role: "owner",
    is_disabled: false,
  });

  if (profileError) {
    await admin.from("organizations").delete().eq("id", organization.id);
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Unable to create user profile." };
  }

  if (isProduction) {
    await admin.auth.admin
      .generateLink({
        type: "signup",
        email: parsed.data.email,
        password: parsed.data.password,
      })
      .catch(() => undefined);
    return { error: "Account created. Confirm your email, then sign in." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) {
    return { error: "Account created. Please sign in." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    return { error: "Unable to create account right now. Please try again." };
  }
}
/** End the current session. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkLoginThrottle, checkSignupThrottle } from "@/lib/security/login-throttle";
import { sendWelcomeEmailAfterSignup } from "@/lib/email/welcome";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWritableClient } from "@/lib/supabase/server";
import { resolveSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { slugifyOrganizationName } from "@/lib/tenancy/context";
import {
  buildB2bEntrepreneurAcceptanceEvidence,
  buildDpaAcceptanceEvidence,
  buildTermsAcceptanceEvidence,
} from "@/lib/billing/contracting";
import { persistContractAcceptance } from "@/lib/billing/contract-acceptance";
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Full name is required."),
  organizationName: z.string().min(2, "Organization name is required."),
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: "You must accept the Terms to create an account.",
  }),
  b2bEntrepreneurConfirmed: z.boolean().refine((value) => value === true, {
    message: "Business / professional purchase confirmation is required for B2B registration.",
  }),
});

export type AuthActionState = {
  error?: string;
  success?: string;
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

  const throttle = checkLoginThrottle(parsed.data.email);
  if (!throttle.allowed) {
    return {
      error: `Too many sign-in attempts. Try again in ${throttle.retryAfterSeconds} seconds.`,
    };
  }

  const supabase = await createWritableClient();
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
 * Email confirmation is intentionally disabled: users can sign in after signup.
 * Does not auto-login — redirects to /login with a neutral success message.
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
    termsAccepted: formData.get("termsAccepted") === "on",
    b2bEntrepreneurConfirmed: formData.get("b2bEntrepreneurConfirmed") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid registration data." };
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

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
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
  const { data: profile, error: profileError } = await admin
    .from("users")
    .insert({
      auth_user_id: authData.user.id,
      organization_id: organization.id,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      role: "owner",
      is_disabled: false,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    await admin.from("organizations").delete().eq("id", organization.id);
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: "Unable to create user profile." };
  }

  try {
    const acceptedAt = new Date().toISOString();
    await persistContractAcceptance({
      organizationId: organization.id,
      userId: profile.id,
      evidence: buildTermsAcceptanceEvidence({ acceptedAt, source: "signup" }),
    });
    await persistContractAcceptance({
      organizationId: organization.id,
      userId: profile.id,
      evidence: buildB2bEntrepreneurAcceptanceEvidence({ acceptedAt, source: "signup" }),
    });
    await persistContractAcceptance({
      organizationId: organization.id,
      userId: profile.id,
      evidence: buildDpaAcceptanceEvidence({ acceptedAt, source: "signup" }),
    });
  } catch {
    console.error("[auth] contract acceptance persistence failed (account retained)");
  }

  // Welcome mail is best-effort — never roll back a successful provisioning.
  try {
    await sendWelcomeEmailAfterSignup({
      userId: profile.id,
      organizationId: organization.id,
      recipientEmail: parsed.data.email,
      fullName: parsed.data.fullName,
      organizationName: parsed.data.organizationName,
    });
  } catch {
    console.error("[email] welcome after signup failed (account retained)");
  }

  revalidatePath("/", "layout");
  redirect("/login?signup=success");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    return { error: "Unable to create account right now. Please try again." };
  }
}
/** End the current session. */
export async function signOut(): Promise<void> {
  const supabase = await createWritableClient();
  await supabase.auth.signOut();
  redirect("/login");
}

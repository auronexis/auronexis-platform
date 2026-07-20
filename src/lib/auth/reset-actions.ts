"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH_MESSAGES, isBenignPasswordResetError, sanitizeAuthError } from "@/lib/auth/messages";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { checkPasswordResetThrottle } from "@/lib/security/login-throttle";
import { isTurnstileConfigured, verifyTurnstileFromForm } from "@/lib/security/turnstile";
import { getAppUrl, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.object({
  email: z.string().trim().email(AUTH_MESSAGES.INVALID_EMAIL),
});

const resetPasswordSchema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const validation = validatePasswordPolicy(data.password);
    if (!validation.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: AUTH_MESSAGES.PASSWORD_TOO_WEAK,
        path: ["password"],
      });
    }

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: AUTH_MESSAGES.PASSWORDS_DO_NOT_MATCH,
        path: ["confirmPassword"],
      });
    }
  });

export type ForgotPasswordActionState = {
  error?: string;
  success?: string;
  retryAfterSeconds?: number;
};

export type ResetPasswordActionState = {
  error?: string;
  fieldErrors?: {
    password?: string;
    confirmPassword?: string;
  };
};

function isAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Send a password reset email — always returns success unless validation/throttle fails. */
export async function requestPasswordResetAction(
  _prevState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? AUTH_MESSAGES.INVALID_EMAIL };
  }

  if (isTurnstileConfigured() || process.env.NODE_ENV === "production") {
    const turnstileOk = await verifyTurnstileFromForm(formData);
    if (!turnstileOk) {
      return { error: AUTH_MESSAGES.GENERIC_ERROR };
    }
  }

  const throttle = checkPasswordResetThrottle(parsed.data.email);
  if (!throttle.allowed) {
    return {
      error: AUTH_MESSAGES.RATE_LIMITED,
      retryAfterSeconds: throttle.retryAfterSeconds,
    };
  }

  if (!isAuthConfigured()) {
    return { error: AUTH_MESSAGES.CONFIGURATION_ERROR };
  }

  try {
    getSupabaseUrl();
    getSupabaseAnonKey();
  } catch {
    return { error: AUTH_MESSAGES.CONFIGURATION_ERROR };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${getAppUrl()}/reset-password`,
    });

    if (error && !isBenignPasswordResetError(error)) {
      const friendly = sanitizeAuthError(error, AUTH_MESSAGES.RESET_FAILED);
      if (friendly === AUTH_MESSAGES.RATE_LIMITED || friendly === AUTH_MESSAGES.NETWORK_ERROR) {
        return {
          error: friendly,
          retryAfterSeconds: throttle.retryAfterSeconds || 30,
        };
      }
      if (friendly === AUTH_MESSAGES.INVALID_EMAIL) {
        return { error: friendly };
      }
    }
  } catch {
    return { error: AUTH_MESSAGES.NETWORK_ERROR };
  }

  return { success: AUTH_MESSAGES.RESET_SENT };
}

/** Update password after recovery session is established. */
export async function updatePasswordAfterResetAction(
  _prevState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: ResetPasswordActionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "password" || field === "confirmPassword") {
        fieldErrors[field] = issue.message;
      }
    }

    return {
      error: parsed.error.issues[0]?.message,
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: AUTH_MESSAGES.RESET_SESSION_EXPIRED };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: sanitizeAuthError(error, AUTH_MESSAGES.GENERIC_ERROR) };
  }

  await supabase.auth.signOut();
  redirect("/login?reset=success");
}

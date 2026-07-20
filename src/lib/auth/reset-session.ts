import "server-only";

import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/server";

export type ResetPasswordSessionResult = {
  canReset: boolean;
  sessionError?: string;
};

/**
 * Exchange a password-reset code for a session and resolve whether the user may reset.
 * Presentation pages must not construct Supabase clients directly.
 */
export async function resolveResetPasswordSession(params: {
  code?: string;
  error?: string;
}): Promise<ResetPasswordSessionResult> {
  const supabase = await createClient();

  let sessionError: string | undefined;

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      sessionError = AUTH_MESSAGES.RESET_TOKEN_INVALID;
    }
  } else if (params.error) {
    sessionError = AUTH_MESSAGES.RESET_TOKEN_INVALID;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    canReset: Boolean(user) && !sessionError,
    sessionError,
  };
}

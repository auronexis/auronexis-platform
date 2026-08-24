import "server-only";

import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/server";

export type ResetPasswordSessionResult = {
  canReset: boolean;
  sessionError?: string;
};

/**
 * Resolve whether the user may reset their password after middleware/callback established the session.
 * Code exchange runs in `/auth/callback` — not during Server Component render.
 */
export async function resolveResetPasswordSession(params: {
  error?: string;
}): Promise<ResetPasswordSessionResult> {
  const supabase = await createClient();

  let sessionError: string | undefined;

  if (params.error) {
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

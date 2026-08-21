import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/env";
import { resolveSafeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

/** Supabase auth callback — OAuth and email action code exchange (PKCE). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = resolveSafeRedirectPath(searchParams.get("next"));
  const appOrigin = getAppUrl().replace(/\/$/, "");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${appOrigin}${next}`);
    }
  }

  return NextResponse.redirect(`${appOrigin}/login?error=auth_callback_failed`);
}

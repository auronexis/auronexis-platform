import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { headers } from "next/headers";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { LoginBrandingShell } from "@/components/branding/login-branding-shell";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { resolveAuthBranding } from "@/lib/branding/auth-branding";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { createClient } from "@/lib/supabase/server";


export const metadata: Metadata = createPageMetadataForPath("/reset-password");

type ResetPasswordPageProps = {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const host = (await headers()).get("host") ?? "";
  const branding = await resolveAuthBranding(host);
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

  const canReset = Boolean(user) && !sessionError;

  return (
    <>
      <WhiteLabelThemeInjector branding={branding} scopeId="reset-password-root" />
      <div id="reset-password-root" className="white-label-scope contents">
        <LoginBrandingShell
          branding={branding}
          footer={<LegalLinksInline className="mt-8 px-4" />}
        >
          <ResetPasswordForm canReset={canReset} sessionError={sessionError} />
        </LoginBrandingShell>
      </div>
    </>
  );
}

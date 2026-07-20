import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { headers } from "next/headers";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { LoginBrandingShell } from "@/components/branding/login-branding-shell";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { resolveAuthBranding } from "@/lib/branding/auth-branding";
import { resolveResetPasswordSession } from "@/lib/auth/reset-session";

export const metadata: Metadata = createPageMetadataForPath("/reset-password");

type ResetPasswordPageProps = {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const host = (await headers()).get("host") ?? "";
  const branding = await resolveAuthBranding(host);
  const { canReset, sessionError } = await resolveResetPasswordSession({
    code: params.code,
    error: params.error,
  });

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

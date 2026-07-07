import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginBrandingShell } from "@/components/branding/login-branding-shell";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { resolveAuthBranding } from "@/lib/branding/auth-branding";
import { getSession } from "@/lib/auth/session";

import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Forgot password",
  description: "Reset your Auroranexis account password.",
  path: "/forgot-password",
  noIndex: true,
});

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const host = (await headers()).get("host") ?? "";
  const branding = await resolveAuthBranding(host);

  return (
    <>
      <WhiteLabelThemeInjector branding={branding} scopeId="forgot-password-root" />
      <div id="forgot-password-root" className="white-label-scope contents">
        <LoginBrandingShell
          branding={branding}
          footer={<LegalLinksInline className="mt-8 px-4" />}
        >
          <ForgotPasswordForm />
        </LoginBrandingShell>
      </div>
    </>
  );
}

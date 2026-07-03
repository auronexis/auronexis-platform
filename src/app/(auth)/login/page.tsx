import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { LoginBrandingShell } from "@/components/branding/login-branding-shell";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { resolveAuthBranding } from "@/lib/branding/auth-branding";
import { getSession } from "@/lib/auth/session";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; redirect?: string; reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const host = (await headers()).get("host") ?? "";
  const branding = await resolveAuthBranding(host);
  const callbackError =
    params.error === "auth_callback_failed"
      ? "Sign-in could not be completed. Please try again."
      : undefined;
  const resetSuccess =
    params.reset === "success" ? AUTH_MESSAGES.PASSWORD_UPDATED : undefined;

  return (
    <>
      <WhiteLabelThemeInjector branding={branding} scopeId="login-root" />
      <div id="login-root" className="white-label-scope contents">
        <LoginBrandingShell
          branding={branding}
          footer={<LegalLinksInline className="mt-8 px-4" />}
        >
          <LoginForm
            redirectTo={params.redirect}
            initialError={callbackError}
            initialSuccess={resetSuccess}
          />
        </LoginBrandingShell>
      </div>
    </>
  );
}

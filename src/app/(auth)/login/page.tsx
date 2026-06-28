import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { LoginBrandingShell } from "@/components/branding/login-branding-shell";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { getSession } from "@/lib/auth/session";
import {
  getPlatformBrandingFallback,
  getPublishedBrandingByHostname,
} from "@/lib/white-label/queries";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const host = (await headers()).get("host") ?? "";
  const branding =
    (await getPublishedBrandingByHostname(host)) ?? getPlatformBrandingFallback();

  return (
    <>
      <WhiteLabelThemeInjector branding={branding} scopeId="login-root" />
      <div id="login-root" className="white-label-scope contents">
        <LoginBrandingShell
          branding={branding}
          footer={<LegalLinksInline className="mt-8 px-4" />}
        >
          <LoginForm />
        </LoginBrandingShell>
      </div>
    </>
  );
}

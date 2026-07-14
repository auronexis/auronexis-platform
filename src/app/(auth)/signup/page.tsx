import type { Metadata } from "next";
import { createPageMetadataForPath } from "@/lib/seo";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ConversionTracker } from "@/components/analytics/conversion-tracker";
import { SignUpForm } from "@/components/auth/signup-form";
import { LoginBrandingShell } from "@/components/branding/login-branding-shell";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { resolveAuthBranding } from "@/lib/branding/auth-branding";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = createPageMetadataForPath("/signup");

export default async function SignUpPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const host = (await headers()).get("host") ?? "";
  const branding = await resolveAuthBranding(host);

  return (
    <>
      <WhiteLabelThemeInjector branding={branding} scopeId="signup-root" />
      <div id="signup-root" className="white-label-scope contents">
        <ConversionTracker event="signup_started" props={{ surface: "signup_page" }} />
        <LoginBrandingShell
          branding={branding}
          footer={<LegalLinksInline className="mt-8 px-4" />}
        >
          <SignUpForm />
        </LoginBrandingShell>
      </div>
    </>
  );
}

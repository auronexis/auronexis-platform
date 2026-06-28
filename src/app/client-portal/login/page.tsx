import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PortalLoginForm } from "@/components/client-portal/portal-login-form";
import { PortalFooter } from "@/components/client-portal/portal-ui";
import { LoginBrandingShell } from "@/components/branding/login-branding-shell";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { resolveAuthBranding } from "@/lib/branding/auth-branding";
import { getClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Client Portal Login",
};

export default async function ClientPortalLoginPage() {
  const session = await getClientPortalSession();

  if (session) {
    redirect("/client-portal/dashboard");
  }

  const host = (await headers()).get("host") ?? "";
  const branding = await resolveAuthBranding(host);

  return (
    <>
      <WhiteLabelThemeInjector branding={branding} scopeId="portal-login-root" />
      <div id="portal-login-root" className="white-label-scope contents">
        <LoginBrandingShell
          branding={branding}
          variant="portal"
          footer={<PortalFooter branding={branding} />}
        >
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Secure sign in
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-foreground">Welcome back</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {branding.portalWelcomeMessage}
              </p>
            </div>
            <PortalLoginForm />
          </div>
        </LoginBrandingShell>
      </div>
    </>
  );
}

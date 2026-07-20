import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { LoginBrandingShell } from "@/components/branding/login-branding-shell";
import { LegalLinksInline } from "@/components/legal/legal-links-inline";
import { WhiteLabelThemeInjector } from "@/components/white-label/white-label-theme-injector";
import { LinkButton } from "@/components/ui/link-button";
import { resolveAuthBranding } from "@/lib/branding/auth-branding";
import { createPrivateAppMetadata } from "@/lib/seo/metadata";
import { getInvitationByToken } from "@/lib/team/queries";
import { INVITE_ROLE_LABELS } from "@/lib/team/types";

export const metadata: Metadata = createPrivateAppMetadata("Accept invitation");

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);
  const host = (await headers()).get("host") ?? "";
  const branding = await resolveAuthBranding(host);

  if (!invitation) {
    notFound();
  }

  if (invitation.accepted_at) {
    return (
      <>
        <WhiteLabelThemeInjector branding={branding} scopeId="invite-root" />
        <div id="invite-root" className="white-label-scope contents">
          <LoginBrandingShell branding={branding} footer={<LegalLinksInline className="mt-8 px-4" />}>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-navy-950">Invitation already used</h1>
              <p className="mt-2 text-sm text-muted">
                This invitation has already been accepted. Sign in to continue.
              </p>
              <LinkButton href="/login" className="mt-6">
                Go to sign in
              </LinkButton>
            </div>
          </LoginBrandingShell>
        </div>
      </>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <>
        <WhiteLabelThemeInjector branding={branding} scopeId="invite-root" />
        <div id="invite-root" className="white-label-scope contents">
          <LoginBrandingShell branding={branding} footer={<LegalLinksInline className="mt-8 px-4" />}>
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-navy-950">Invitation expired</h1>
              <p className="mt-2 text-sm text-muted">
                Ask your organization admin to send a new invitation.
              </p>
            </div>
          </LoginBrandingShell>
        </div>
      </>
    );
  }

  return (
    <>
      <WhiteLabelThemeInjector branding={branding} scopeId="invite-root" />
      <div id="invite-root" className="white-label-scope contents">
        <LoginBrandingShell branding={branding} footer={<LegalLinksInline className="mt-8 px-4" />}>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-navy-950">Join Auroranexis</h1>
            <p className="mt-2 text-sm text-muted">Create your account to accept the invitation.</p>
          </div>
          <AcceptInviteForm
            token={token}
            email={invitation.email}
            organizationName={invitation.organization.name}
            roleLabel={INVITE_ROLE_LABELS[invitation.role]}
          />
        </LoginBrandingShell>
      </div>
    </>
  );
}

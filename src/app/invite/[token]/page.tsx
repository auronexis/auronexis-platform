import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { getInvitationByToken } from "@/lib/team/queries";
import { INVITE_ROLE_LABELS } from "@/lib/team/types";

export const metadata: Metadata = {
  title: "Accept invitation",
};

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  if (invitation.accepted_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-navy-950">Invitation already used</h1>
          <p className="mt-2 text-sm text-muted">
            This invitation has already been accepted. Sign in to continue.
          </p>
          <a
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-accent-blue hover:underline"
          >
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm text-center">
          <h1 className="text-2xl font-semibold text-navy-950">Invitation expired</h1>
          <p className="mt-2 text-sm text-muted">
            Ask your organization admin to send a new invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
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
      </div>
    </div>
  );
}

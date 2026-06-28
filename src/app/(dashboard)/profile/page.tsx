import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AccountCenter } from "@/components/profile/account-center";
import { requireSession } from "@/lib/auth/session";
import { getPermissionsSummary } from "@/lib/profile/display";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await requireSession();
  const permissions = getPermissionsSummary(session.role);

  return (
    <>
      <PageHeader
        module="settings"
        eyebrow="Account"
        title="Profile"
        description="Manage your personal preferences, appearance, notifications, and account security."
        status={{
          label: session.user.is_disabled ? "Inactive" : "Active",
          tone: session.user.is_disabled ? "neutral" : "success",
        }}
      />

      <AccountCenter session={session} permissions={permissions} />
    </>
  );
}

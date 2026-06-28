import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SlaPolicyForm } from "@/components/settings/sla-policy-form";
import { PageHeader } from "@/components/layout/page-header";
import { createSlaPolicyAction } from "@/lib/sla/actions";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Create SLA policy",
};

export default async function NewSlaPolicyPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/settings/sla");
  }

  return (
    <>
      <PageHeader
        title="Create SLA policy"
        description="Define incident and risk response-time targets."
        action={
          <Link href="/settings/sla" className="text-sm font-medium text-accent-blue hover:underline">
            Back to SLA policies
          </Link>
        }
      />

      <div className="max-w-3xl rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <SlaPolicyForm
          action={createSlaPolicyAction}
          submitLabel="Create policy"
          pendingLabel="Creating…"
        />
      </div>
    </>
  );
}

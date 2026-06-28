import type { Metadata } from "next";
import Link from "next/link";
import { SlaPolicyList } from "@/components/settings/sla-policy-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listSlaPolicies } from "@/lib/sla/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "SLA policies",
};

export default async function SlaSettingsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const policies = await listSlaPolicies(session);
  const canManage = canManageOrganizationSettings(session);

  return (
    <>
      <PageHeader
        module="settings"
        title="SLA policies"
        description="Define response-time targets for incidents and risks."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/settings" className="text-sm font-medium text-accent-blue hover:underline">
              Back to settings
            </Link>
            {canManage ? (
              <Link href="/settings/sla/new">
                <Button>Create policy</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <SlaPolicyList policies={policies} canManage={canManage} />
    </>
  );
}

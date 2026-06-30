import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/authorization/access-denied";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { SlaPolicyList } from "@/components/settings/sla-policy-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listSlaPolicies } from "@/lib/sla/queries";
import { canManageSlaPolicies } from "@/lib/team/guards";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "SLA policies",
};

export default async function SlaSettingsPage() {
  const session = await requireSession();

  if (!sessionHasPermission(session, "sla.read")) {
    return (
      <>
        <PageHeader
          module="settings"
          title="SLA policies"
          description="Define response-time targets for incidents and risks."
        />
        <AccessDenied />
      </>
    );
  }

  const policies = await listSlaPolicies(session);
  const canManage = canManageSlaPolicies(session);

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

import type { Metadata } from "next";
import Link from "next/link";
import { EscalationRuleList } from "@/components/settings/escalation-rule-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listEscalationRules } from "@/lib/escalation/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Escalation rules",
};

export default async function EscalationSettingsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const rules = await listEscalationRules(session);
  const canManage = canManageOrganizationSettings(session);

  return (
    <>
      <PageHeader
        module="settings"
        title="Escalation rules"
        description="Configure automated reactions to SLA breaches and critical operational events."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/settings" className="text-sm font-medium text-accent-blue hover:underline">
              Back to settings
            </Link>
            {canManage ? (
              <Link href="/settings/escalation/new">
                <Button>Create rule</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <EscalationRuleList rules={rules} canManage={canManage} />
    </>
  );
}

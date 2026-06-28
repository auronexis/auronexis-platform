import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EscalationRuleForm } from "@/components/settings/escalation-rule-form";
import { PageHeader } from "@/components/layout/page-header";
import { createEscalationRuleAction } from "@/lib/escalation/actions";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Create escalation rule",
};

export default async function NewEscalationRulePage() {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/settings/escalation");
  }

  return (
    <>
      <PageHeader
        title="Create escalation rule"
        description="Define when and how your organization responds to operational triggers."
        action={
          <Link
            href="/settings/escalation"
            className="text-sm font-medium text-accent-blue hover:underline"
          >
            Back to escalation rules
          </Link>
        }
      />

      <div className="max-w-3xl rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <EscalationRuleForm
          action={createEscalationRuleAction}
          submitLabel="Create rule"
          pendingLabel="Creating…"
        />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteEscalationRuleButton } from "@/components/settings/delete-escalation-rule-button";
import { EscalationRuleForm } from "@/components/settings/escalation-rule-form";
import { ToggleEscalationRuleButton } from "@/components/settings/toggle-escalation-rule-button";
import { PageHeader } from "@/components/layout/page-header";
import { updateEscalationRuleAction } from "@/lib/escalation/actions";
import { getEscalationRuleById } from "@/lib/escalation/queries";
import { ESCALATION_TRIGGER_LABELS } from "@/lib/escalation/types";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type EscalationRuleDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EscalationRuleDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const rule = await getEscalationRuleById(session, id);

  return {
    title: rule?.name ?? "Escalation rule",
  };
}

export default async function EscalationRuleDetailPage({ params }: EscalationRuleDetailPageProps) {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const { id } = await params;
  const rule = await getEscalationRuleById(session, id);

  if (!rule) {
    notFound();
  }

  const canManage = canManageOrganizationSettings(session);
  const boundUpdateAction = updateEscalationRuleAction.bind(null, rule.id);
  const triggerLabel =
    ESCALATION_TRIGGER_LABELS[rule.trigger_type as keyof typeof ESCALATION_TRIGGER_LABELS] ??
    rule.trigger_type;

  return (
    <>
      <PageHeader
        title={rule.name}
        description={
          canManage
            ? "Edit escalation triggers, recipients, and actions."
            : "View escalation triggers, recipients, and actions."
        }
        action={
          <Link
            href="/settings/escalation"
            className="text-sm font-medium text-accent-blue hover:underline"
          >
            Back to escalation rules
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
        {rule.enabled ? (
          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-inset ring-green-600/20">
            Active
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-secondary ring-1 ring-inset ring-border-strong">
            Disabled
          </span>
        )}
        <span>Trigger: {triggerLabel}</span>
        <span>·</span>
        <span>Delay: {rule.delay_minutes > 0 ? `${rule.delay_minutes} minutes` : "Immediate"}</span>
      </div>

      {canManage ? (
        <div className="max-w-3xl space-y-8">
          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
            <EscalationRuleForm
              action={boundUpdateAction}
              rule={rule}
              submitLabel="Save changes"
              pendingLabel="Saving…"
            />
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-navy-950">Rule status</h2>
            <p className="mt-1 text-sm text-muted">
              Disabled rules are ignored when operational triggers fire.
            </p>
            <div className="mt-4">
              <ToggleEscalationRuleButton ruleId={rule.id} enabled={rule.enabled} />
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-navy-950">Delete rule</h2>
            <p className="mt-1 text-sm text-muted">
              Deleting a rule stops future escalations but preserves past execution history.
            </p>
            <div className="mt-4">
              <DeleteEscalationRuleButton ruleId={rule.id} ruleName={rule.name} />
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <EscalationRuleForm
            action={boundUpdateAction}
            rule={rule}
            submitLabel="Save changes"
            pendingLabel="Saving…"
            readOnly
          />
        </div>
      )}
    </>
  );
}

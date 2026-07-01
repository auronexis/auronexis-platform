import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteSlaPolicyButton } from "@/components/settings/delete-sla-policy-button";
import { SetDefaultSlaPolicyButton } from "@/components/settings/set-default-sla-policy-button";
import { SlaPolicyForm } from "@/components/settings/sla-policy-form";
import { PageHeader } from "@/components/layout/page-header";
import { updateSlaPolicyAction } from "@/lib/sla/actions";
import { getSlaPolicyById } from "@/lib/sla/queries";
import { listSlaBreachHistory } from "@/lib/sla/summary";
import { SLATimeline } from "@/components/sla/sla-activity-timeline";
import { SLAHistory } from "@/components/sla/sla-history";
import { SLAMetrics } from "@/components/sla/sla-metrics";
import { getSLAMetrics } from "@/lib/sla/metrics";
import { createClient } from "@/lib/supabase/server";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type SlaPolicyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SlaPolicyDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const policy = await getSlaPolicyById(session, id);

  return {
    title: policy?.name ?? "SLA policy",
  };
}

export default async function SlaPolicyDetailPage({ params }: SlaPolicyDetailPageProps) {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const { id } = await params;
  const policy = await getSlaPolicyById(session, id);

  if (!policy) {
    notFound();
  }

  const canManage = canManageOrganizationSettings(session);
  const boundUpdateAction = updateSlaPolicyAction.bind(null, policy.id);
  const [slaMetrics, breachHistory] = await Promise.all([
    getSLAMetrics(session).catch(() => null),
    listSlaBreachHistory(session, { policyId: policy.id, limit: 8 }),
  ]);

  const supabase = await createClient();
  const { data: activityData } = await supabase
    .from("sla_activity")
    .select("id, organization_id, event_type, actor_user_id, incident_id, message, metadata, created_at")
    .eq("organization_id", session.organization.id)
    .contains("metadata", { policyId: policy.id })
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <>
      <PageHeader
        title={policy.name}
        description={
          canManage
            ? "Edit SLA response-time targets for your organization."
            : "View SLA response-time targets for your organization."
        }
        action={
          <Link href="/settings/sla" className="text-sm font-medium text-accent-blue hover:underline">
            Back to SLA policies
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
        {policy.is_default ? (
          <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20">
            Default
          </span>
        ) : null}
        <span>
          Incidents: {policy.incident_hours ? `${policy.incident_hours}h` : "—"}
        </span>
        <span>·</span>
        <span>Risks: {policy.risk_hours ? `${policy.risk_hours}h` : "—"}</span>
      </div>

      {slaMetrics ? (
        <div className="mb-8">
          <SLAMetrics metrics={slaMetrics} />
        </div>
      ) : null}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">SLA timeline</h2>
          <p className="mt-1 text-sm text-muted">Recent SLA activity for this policy.</p>
          <div className="mt-4">
            <SLATimeline events={(activityData ?? []) as never} />
          </div>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Breach history</h2>
          <p className="mt-1 text-sm text-muted">Incidents that breached SLA targets under this policy.</p>
          <div className="mt-4">
            <SLAHistory events={breachHistory} />
          </div>
        </div>
      </div>

      {canManage ? (
        <div className="max-w-3xl space-y-8">
          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
            <SlaPolicyForm
              action={boundUpdateAction}
              policy={policy}
              submitLabel="Save changes"
              pendingLabel="Saving…"
            />
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Default policy</h2>
            <p className="mt-1 text-sm text-muted">
              Only one policy can be the organization default. Clients without an assigned policy
              inherit this default.
            </p>
            <div className="mt-4">
              <SetDefaultSlaPolicyButton
                policyId={policy.id}
                policyName={policy.name}
                isDefault={policy.is_default}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Delete policy</h2>
            <p className="mt-1 text-sm text-muted">
              Deleting a policy clears client assignments that reference it.
            </p>
            <div className="mt-4">
              <DeleteSlaPolicyButton policyId={policy.id} policyName={policy.name} />
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
          <SlaPolicyForm
            action={boundUpdateAction}
            policy={policy}
            submitLabel="Save changes"
            pendingLabel="Saving…"
            readOnly
          />
        </div>
      )}
    </>
  );
}

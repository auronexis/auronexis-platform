import type { Metadata } from "next";
import Link from "next/link";
import { EnterpriseRequestCard } from "@/components/settings/enterprise-request-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { PLAN_SOURCE_LABELS } from "@/lib/plans/plan-source-labels";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { getEffectiveLimitsFromFeatures } from "@/lib/enterprise/limits";
import { getEnterpriseStatus } from "@/lib/enterprise/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Enterprise",
};

export default async function EnterpriseSettingsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const canManage = canManageOrganizationSettings(session);
  const [plan, enterpriseStatus] = await Promise.all([
    getOrganizationPlanContextForSession(session),
    getEnterpriseStatus(session.organization.id),
  ]);
  const limits = getEffectiveLimitsFromFeatures(plan.features);

  return (
    <>
      <PageHeader
        module="settings"
        title="Enterprise"
        description="Review effective plan limits, Enterprise request status, and enabled capabilities."
      />

      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className="font-medium text-accent-blue hover:underline">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <span>Enterprise</span>
      </div>

      <EnterpriseRequestCard status={enterpriseStatus} canManage={canManage} />

      <PageSurface className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Effective plan</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <dt className="text-muted">Plan</dt>
            <dd className="mt-1 font-medium text-foreground">{plan.planLabel}</dd>
          </div>
          <div>
            <dt className="text-muted">Source</dt>
            <dd className="mt-1 font-medium text-foreground">{PLAN_SOURCE_LABELS[plan.planSource]}</dd>
          </div>
          <div>
            <dt className="text-muted">Seats</dt>
            <dd className="mt-1 font-medium text-foreground">{limits.seats}</dd>
          </div>
          <div>
            <dt className="text-muted">Clients</dt>
            <dd className="mt-1 font-medium text-foreground">
              {limits.maxClients ?? "Unlimited"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Monitoring limit</dt>
            <dd className="mt-1 font-medium text-foreground">
              {limits.monitoringLimit ?? "Plan default"}
            </dd>
          </div>
        </dl>
      </PageSurface>
    </>
  );
}

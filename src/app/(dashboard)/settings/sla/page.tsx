import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/authorization/access-denied";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { SlaPolicyList } from "@/components/settings/sla-policy-list";
import { SLAMetrics } from "@/components/sla/sla-metrics";
import { SLAComplianceChart } from "@/components/sla/sla-compliance-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listSlaPolicies } from "@/lib/sla/queries";
import { getSLAMetrics } from "@/lib/sla/metrics";
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

  const policiesResult = await listSlaPolicies(session).catch((error) => {
    console.warn("[settings/sla] listSlaPolicies failed:", error);
    return [] as Awaited<ReturnType<typeof listSlaPolicies>>;
  });
  const policies = policiesResult;
  const canManage = canManageSlaPolicies(session);
  const slaMetrics = await getSLAMetrics(session).catch(() => ({
    breachedCount: 0,
    compliancePercent: 100,
    avgResponseMinutes: null,
    avgResolutionMinutes: null,
    criticalBreaches: 0,
    openTimers: 0,
    monthlyTrend: [],
  }));

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

      <div className="mb-8 space-y-6">
        <SLAMetrics metrics={slaMetrics} />
        <SLAComplianceChart points={slaMetrics.monthlyTrend} />
      </div>

      <SlaPolicyList policies={policies} canManage={canManage} />
    </>
  );
}

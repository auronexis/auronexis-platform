import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
import { PortalSlaStatus } from "@/components/sla/portal-sla-status";
import {
  PortalEmptyState,
  PortalPageHeader,
  PortalTableShell,
  portalTableCellClass,
  portalTableHeadClass,
} from "@/components/client-portal/portal-ui";
import { listPortalRisks } from "@/lib/client-portal/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";
import { getOrganizationPlanContext } from "@/lib/plans/queries";
import { attachRiskSlaInfo } from "@/lib/sla/queries";
import { normalizeRiskStatusForDisplay } from "@/lib/risks/types";
import type { EntitySlaInfo } from "@/lib/sla/types";
import type { RiskSeverity, RiskStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Portal Risks",
};

export default async function ClientPortalRisksPage() {
  const session = await requireClientPortalSession();
  const plan = await getOrganizationPlanContext(session.organization.id);

  if (!plan.features.risks) {
    redirect("/client-portal/overview");
  }

  const baseRisks = (await listPortalRisks(session)).map((risk) => ({
    ...risk,
    client_id: session.client.id,
    status: risk.status as RiskStatus,
  }));

  const risks = plan.features.sla_tracking
    ? await attachRiskSlaInfo(session.organization.id, baseRisks)
    : baseRisks;

  const showSla = plan.features.sla_tracking;

  return (
    <>
      <PortalPageHeader
        title="Open Risks"
        description="Operational risks currently tracked for your account."
      />

      {risks.length === 0 ? (
        <PortalEmptyState
          title="No open risks"
          description="There are no open risks to display right now."
        />
      ) : (
        <PortalTableShell>
          <table className="min-w-full divide-y divide-border-subtle">
            <thead>
              <tr>
                <th className={portalTableHeadClass}>Title</th>
                <th className={portalTableHeadClass}>Severity</th>
                <th className={portalTableHeadClass}>Status</th>
                {showSla ? <th className={portalTableHeadClass}>SLA</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {risks.map((risk) => (
                <tr key={risk.id}>
                  <td className={`font-semibold text-foreground ${portalTableCellClass}`}>
                    {risk.title}
                  </td>
                  <td className={`whitespace-nowrap ${portalTableCellClass}`}>
                    <RiskSeverityBadge severity={risk.severity as RiskSeverity} />
                  </td>
                  <td className={`whitespace-nowrap ${portalTableCellClass}`}>
                    <RiskStatusBadge status={normalizeRiskStatusForDisplay(risk.status)} />
                  </td>
                  {showSla ? (
                    <td className={`whitespace-nowrap ${portalTableCellClass}`}>
                      <PortalSlaStatus
                        sla={(risk as unknown as { sla: EntitySlaInfo }).sla}
                      />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </PortalTableShell>
      )}
    </>
  );
}

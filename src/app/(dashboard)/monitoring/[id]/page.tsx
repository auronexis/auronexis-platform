import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConnectorActions } from "@/components/monitoring/connector-actions";
import { ConnectorForm } from "@/components/monitoring/connector-form";
import { ConnectorHealthBadge } from "@/components/monitoring/connector-health-badge";
import { ConnectorProviderBadge } from "@/components/monitoring/connector-provider-badge";
import { MonitoringEventList } from "@/components/monitoring/monitoring-event-list";
import { MonitoringStatusBadge } from "@/components/monitoring/monitoring-status-badge";
import { MonitoringTimeline } from "@/components/monitoring/monitoring-timeline";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { requireSession } from "@/lib/auth/session";
import { listClients } from "@/lib/clients/queries";
import { updateMonitoringConnectorAction } from "@/lib/monitoring/actions";
import {
  getConnector,
  getConnectorMetrics,
  listMonitoringActivity,
  listMonitoringEvents,
} from "@/lib/monitoring";
import { formatMonitoringTimestamp } from "@/lib/monitoring/types";
import { canAccessModule } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { linkText } from "@/lib/ui/tokens";

type MonitoringDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: MonitoringDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const connector = await getConnector(session, id);
  return { title: connector?.name ?? "Connector" };
}

export default async function MonitoringDetailPage({ params }: MonitoringDetailPageProps) {
  await requireModuleAccess("monitoring");
  const session = await requireSession();
  const { id } = await params;
  const connector = await getConnector(session, id);

  if (!connector) {
    notFound();
  }

  const canManage = canAccessModule(session.role, "monitoring", "update");
  const [metrics, events, activity, clients] = await Promise.all([
    getConnectorMetrics(session, id),
    listMonitoringEvents(session, { connectorId: id, limit: 15 }),
    listMonitoringActivity(session, { connectorId: id, limit: 12 }),
    listClients(session),
  ]);

  async function updateConnectorFormAction(formData: FormData) {
    "use server";
    await updateMonitoringConnectorAction(id, {}, formData);
  }

  return (
    <>
      <PageHeader
        module="monitoring"
        title={connector.name}
        description={`${connector.provider} connector · ${connector.enabled ? "Enabled" : "Disabled"}`}
        action={
          <Link href="/monitoring" className={linkText}>
            Back to monitoring
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <MonitoringStatusBadge status={connector.status} />
        <ConnectorProviderBadge provider={connector.provider} />
        <ConnectorHealthBadge healthPercent={metrics.healthPercent} />
      </div>

      <ConnectorActions connectorId={connector.id} status={connector.status} canManage={canManage} />

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Last check</dt>
          <dd className="mt-1 text-sm font-medium">{formatMonitoringTimestamp(connector.last_check_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Last success</dt>
          <dd className="mt-1 text-sm font-medium">{formatMonitoringTimestamp(connector.last_success_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Last failure</dt>
          <dd className="mt-1 text-sm font-medium">{formatMonitoringTimestamp(connector.last_failure_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Total events</dt>
          <dd className="mt-1 text-sm font-medium">{metrics.totalEvents}</dd>
        </div>
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <DashboardPanel title="Recent events" description="Signals detected by this connector.">
            <MonitoringEventList events={events} />
          </DashboardPanel>

          <DashboardPanel title="Activity timeline" description="Lifecycle and health check history.">
            <MonitoringTimeline items={activity} />
          </DashboardPanel>
        </div>

        <div className="lg:col-span-5">
          {canManage ? (
            <DashboardPanel title="Configuration" description="Update connector settings and integrations.">
              <ConnectorForm
                action={updateConnectorFormAction}
                clients={clients.map((client) => ({ id: client.id, name: client.name }))}
                defaultValues={{
                  name: connector.name,
                  provider: connector.provider,
                  clientId: connector.configuration.clientId ?? undefined,
                  endpoint: connector.configuration.endpoint ?? undefined,
                  createRiskOnFailure: connector.configuration.createRiskOnFailure ?? true,
                  createIncidentOnCritical: connector.configuration.createIncidentOnCritical ?? false,
                  healthImpactEnabled: connector.configuration.healthImpactEnabled ?? true,
                }}
                submitLabel="Update connector"
              />
            </DashboardPanel>
          ) : null}
        </div>
      </div>
    </>
  );
}

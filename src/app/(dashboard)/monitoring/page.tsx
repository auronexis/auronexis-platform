import type { Metadata } from "next";
import Link from "next/link";
import { ConnectorEmptyState } from "@/components/monitoring/connector-empty-state";
import { ConnectorForm } from "@/components/monitoring/connector-form";
import { MonitoringConnectorCard } from "@/components/monitoring/monitoring-connector-card";
import { MonitoringEventList } from "@/components/monitoring/monitoring-event-list";
import { MonitoringMetrics } from "@/components/monitoring/monitoring-metrics";
import { MonitoringTimeline } from "@/components/monitoring/monitoring-timeline";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { requireSession } from "@/lib/auth/session";
import { listClients } from "@/lib/clients/queries";
import { createMonitoringConnectorAction } from "@/lib/monitoring/actions";
import {
  getConnectorMetrics,
  getMonitoringSummary,
  listConnectors,
} from "@/lib/monitoring";
import { canAccessModule } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Monitoring",
};

export default async function MonitoringPage() {
  await requireModuleAccess("monitoring");
  const session = await requireSession();
  const canManage = canAccessModule(session.role, "monitoring", "create");

  const [summary, connectors, clientOptions] = await Promise.all([
    getMonitoringSummary(session),
    listConnectors(session),
    listClients(session).then((items) => items.map((client) => ({ id: client.id, name: client.name }))),
  ]);

  const createConnectorFormAction = async (formData: FormData) => {
    "use server";
    await createMonitoringConnectorAction({}, formData);
  };

  const connectorCards = await Promise.all(
    connectors.map(async (connector) => ({
      connector,
      metrics: await getConnectorMetrics(session, connector.id),
    })),
  );

  return (
    <>
      <PageHeader
        module="monitoring"
        title="Monitoring Connectors"
        description="Collect operational signals from providers and route failures into health, risk, and incident workflows."
      />

      <div className="mb-8">
        <MonitoringMetrics
          metrics={{
            activeConnectors: summary.activeConnectors,
            failedConnectors: summary.failedConnectors,
            eventsToday: summary.eventsToday,
            criticalEvents: summary.criticalEventsToday,
            lastCheckAt: summary.lastCheckAt,
            connectorHealthPercent: summary.connectorHealthPercent,
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <DashboardPanel title="Connectors" description="Active monitoring integrations for this organization.">
            {connectors.length === 0 ? (
              <ConnectorEmptyState />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {connectorCards.map(({ connector, metrics }) => (
                  <MonitoringConnectorCard
                    key={connector.id}
                    connector={connector}
                    healthPercent={metrics.healthPercent}
                  />
                ))}
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Recent events" description="Latest operational signals detected by connectors.">
            <MonitoringEventList events={summary.recentEvents} />
          </DashboardPanel>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {canManage ? (
            <DashboardPanel title="Add connector" description="Register a new monitoring provider.">
              <ConnectorForm
                action={createConnectorFormAction}
                clients={clientOptions}
                submitLabel="Create connector"
              />
            </DashboardPanel>
          ) : null}

          <DashboardPanel title="Activity" description="Connector lifecycle and health check history.">
            <MonitoringTimeline items={summary.recentActivity} />
          </DashboardPanel>

          <DashboardPanel title="Quick links" description="Related operational modules.">
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/risks" className="text-primary hover:underline">
                  Risk Center
                </Link>
              </li>
              <li>
                <Link href="/incidents" className="text-primary hover:underline">
                  Incidents
                </Link>
              </li>
              <li>
                <Link href="/activity" className="text-primary hover:underline">
                  Activity feed
                </Link>
              </li>
            </ul>
          </DashboardPanel>
        </div>
      </div>
    </>
  );
}

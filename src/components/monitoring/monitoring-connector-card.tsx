import Link from "next/link";
import { ConnectorHealthBadge } from "@/components/monitoring/connector-health-badge";
import { ConnectorProviderBadge } from "@/components/monitoring/connector-provider-badge";
import { MonitoringStatusBadge } from "@/components/monitoring/monitoring-status-badge";
import type { MonitoringConnector } from "@/lib/monitoring/types";
import { formatMonitoringTimestamp } from "@/lib/monitoring/types";
import { auroraSurfaceInteractive } from "@/lib/ui/aurora";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type MonitoringConnectorCardProps = {
  connector: MonitoringConnector;
  healthPercent?: number;
};

export function MonitoringConnectorCard({ connector, healthPercent = 100 }: MonitoringConnectorCardProps) {
  return (
    <Link
      href={`/monitoring/${connector.id}`}
      className={cn(auroraSurfaceInteractive, "block p-5 no-underline")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn(linkText, "text-base font-semibold no-underline")}>{connector.name}</p>
          <p className="mt-1 text-sm text-muted">
            Last check {formatMonitoringTimestamp(connector.last_check_at)}
          </p>
        </div>
        <MonitoringStatusBadge status={connector.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <ConnectorProviderBadge provider={connector.provider} />
        <ConnectorHealthBadge healthPercent={healthPercent} />
      </div>
    </Link>
  );
}

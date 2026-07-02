import Link from "next/link";
import { MonitoringMetrics } from "@/components/monitoring/monitoring-metrics";
import type { MonitoringDashboardMetrics } from "@/lib/monitoring/types";
import { linkText } from "@/lib/ui/tokens";

type DashboardMonitoringOverviewProps = {
  metrics: MonitoringDashboardMetrics;
};

export function DashboardMonitoringOverview({ metrics }: DashboardMonitoringOverviewProps) {
  return (
    <div className="space-y-4">
      <MonitoringMetrics metrics={metrics} />
      <Link href="/monitoring" className={linkText}>
        View monitoring connectors
      </Link>
    </div>
  );
}

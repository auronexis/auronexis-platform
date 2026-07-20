import { MONITORING_PROVIDER_LABELS, type MonitoringProvider } from "@/lib/monitoring/types";
import { StatusBadge } from "@/components/ui/badge";

type ConnectorProviderBadgeProps = {
  provider: string;
  className?: string;
};

export function ConnectorProviderBadge({ provider, className }: ConnectorProviderBadgeProps) {
  const label = MONITORING_PROVIDER_LABELS[provider as MonitoringProvider] ?? provider;

  return (
    <StatusBadge tone="info" className={className}>
      {label}
    </StatusBadge>
  );
}

import { MONITORING_PROVIDER_LABELS, type MonitoringProvider } from "@/lib/monitoring/types";
import { cn } from "@/lib/utils/cn";

type ConnectorProviderBadgeProps = {
  provider: string;
  className?: string;
};

export function ConnectorProviderBadge({ provider, className }: ConnectorProviderBadgeProps) {
  const label =
    MONITORING_PROVIDER_LABELS[provider as MonitoringProvider] ?? provider;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary",
        className,
      )}
    >
      {label}
    </span>
  );
}

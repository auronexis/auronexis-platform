import { Button } from "@/components/ui/button";
import type { ApiWebhookEndpointView } from "@/lib/api/types";
import { formatBillingDateTime } from "@/lib/billing/types";

type WebhookEndpointCardProps = {
  endpoint: ApiWebhookEndpointView;
  onDisable?: (endpointId: string) => void;
  disabled?: boolean;
};

export function WebhookEndpointCard({
  endpoint,
  onDisable,
  disabled = false,
}: WebhookEndpointCardProps) {
  const isActive = endpoint.status === "active";

  return (
    <div className="rounded-xl border border-border/70 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{endpoint.description ?? endpoint.url}</p>
          <p className="mt-1 break-all text-xs text-muted">{endpoint.url}</p>
          <p className="mt-2 text-xs text-muted">
            {isActive ? "Active" : "Disabled"} · updated{" "}
            {formatBillingDateTime(endpoint.updatedAt)}
          </p>
          {endpoint.events.length > 0 ? (
            <p className="mt-2 text-xs text-muted">{endpoint.events.join(", ")}</p>
          ) : null}
        </div>
        {isActive && onDisable ? (
          <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onDisable(endpoint.id)}>
            Disable
          </Button>
        ) : null}
      </div>
    </div>
  );
}

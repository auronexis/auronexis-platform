import type { ApiWebhookDeliveryView } from "@/lib/api/types";
import { formatBillingDateTime } from "@/lib/billing/types";
import { ApiEmptyState } from "@/components/settings/api/api-empty-state";

type WebhookDeliveryListProps = {
  deliveries: ApiWebhookDeliveryView[];
};

export function WebhookDeliveryList({ deliveries }: WebhookDeliveryListProps) {
  if (deliveries.length === 0) {
    return (
      <ApiEmptyState
        title="No webhook deliveries yet"
        description="Deliveries appear here after outbound events are dispatched."
      />
    );
  }

  return (
    <div className="space-y-2">
      {deliveries.map((delivery) => (
        <div key={delivery.id} className="rounded-xl border border-border/70 px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-foreground">{delivery.eventType}</p>
            <span className="text-xs text-muted">{delivery.status}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Attempts {delivery.attempts}
            {delivery.responseStatus != null ? ` · HTTP ${delivery.responseStatus}` : ""} ·{" "}
            {formatBillingDateTime(delivery.createdAt)}
          </p>
          {delivery.errorMessage ? (
            <p className="mt-2 line-clamp-2 text-xs text-muted">{delivery.errorMessage}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

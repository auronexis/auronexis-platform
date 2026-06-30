import Link from "next/link";
import { SlaStatusBadge } from "@/components/sla/sla-status-badge";
import { formatSlaDueDate } from "@/lib/sla/calculations";
import type { SlaBreachAlertItem } from "@/lib/sla/types";

type DashboardUpcomingSlaBreachesProps = {
  items: SlaBreachAlertItem[];
};

export function DashboardUpcomingSlaBreaches({ items }: DashboardUpcomingSlaBreachesProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">
        No open incidents or risks with active SLA tracking.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={`${item.entityType}-${item.id}`} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={item.href} className="font-medium text-foreground hover:text-primary">
                {item.title}
              </Link>
              <p className="mt-1 text-xs text-muted">
                {item.clientName ?? "Unassigned client"} · Due {formatSlaDueDate(item.dueAt)}
              </p>
            </div>
            <SlaStatusBadge status={item.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

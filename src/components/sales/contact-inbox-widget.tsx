import Link from "next/link";
import type { PipelineDashboardMetrics } from "@/lib/sales/queries";
import { SALES_INBOXES } from "@/lib/sales/pipeline-stages";

export function ContactInboxWidget({ metrics }: { metrics: PipelineDashboardMetrics }) {
  return (
    <section className="aurora-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Contact inbox</h2>
          <p className="mt-1 text-sm text-muted">Inbound lead counters by public inbox.</p>
        </div>
        <Link href="/sales/inbox" className="text-sm font-medium text-primary hover:underline">
          Open inbox
        </Link>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {SALES_INBOXES.map((inbox) => (
          <li key={inbox.key} className="rounded-xl border border-border-subtle bg-surface-2/40 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">{inbox.label}</p>
                <p className="text-xs text-muted">{inbox.email}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-semibold text-primary">
                {metrics.inboxCounts[inbox.key]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

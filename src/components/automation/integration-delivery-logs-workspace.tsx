import type { IntegrationDeliveryLogView } from "@/lib/integrations/types";
import { cn } from "@/lib/utils/cn";

const STATUS_STYLES: Record<
  IntegrationDeliveryLogView["status"],
  string
> = {
  queued: "bg-muted/15 text-muted",
  sending: "bg-accent-blue/10 text-accent-blue",
  delivered: "bg-success/10 text-success",
  failed: "bg-destructive/10 text-destructive",
  rate_limited: "bg-warning/10 text-warning",
  retrying: "bg-primary/10 text-primary",
  dead_letter: "bg-destructive/15 text-destructive",
};

type IntegrationDeliveryLogsTableProps = {
  logs: IntegrationDeliveryLogView[];
};

export function IntegrationDeliveryLogsTable({ logs }: IntegrationDeliveryLogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">No delivery logs yet</p>
        <p className="mt-2 text-sm text-muted">
          Integration deliveries from workflow executions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-surface/80">
          <tr>
            {["Provider", "Workflow", "Status", "Retries", "Duration", "Response", "Timestamp"].map(
              (header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  {header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70 bg-background/40">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 font-medium text-foreground">{log.providerId}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted">
                {log.workflowId ? log.workflowId.slice(0, 8) : "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    STATUS_STYLES[log.status],
                  )}
                >
                  {log.status.replace(/_/g, " ")}
                </span>
              </td>
              <td className="px-4 py-3 text-foreground">{log.retryCount}</td>
              <td className="px-4 py-3 text-foreground">
                {log.latencyMs != null ? `${log.latencyMs}ms` : "—"}
              </td>
              <td className="px-4 py-3 text-foreground">
                {log.responseCode != null ? log.responseCode : "—"}
              </td>
              <td className="px-4 py-3 text-muted">
                {new Date(log.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

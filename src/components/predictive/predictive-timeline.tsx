import Link from "next/link";
import type { PredictiveSnapshotRecord } from "@/lib/predictive/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type PredictiveTimelineProps = {
  snapshots: PredictiveSnapshotRecord[];
  emptyMessage?: string;
};

export function PredictiveTimeline({
  snapshots,
  emptyMessage = "No predictive snapshots recorded yet.",
}: PredictiveTimelineProps) {
  if (snapshots.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-3">
      {snapshots.map((snapshot) => (
        <li
          key={snapshot.id}
          className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-border bg-surface/60 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              {snapshot.snapshotDate}
              {snapshot.clientId ? (
                <>
                  {" · "}
                  <Link href={`/predictive/${snapshot.clientId}`} className={cn(linkText)}>
                    Client snapshot
                  </Link>
                </>
              ) : (
                " · Organization"
              )}
            </p>
            <p className="mt-1 text-xs text-muted">
              Health {snapshot.predictedHealth ?? snapshot.healthScore ?? "—"} · Risk{" "}
              {snapshot.predictedRisk ?? snapshot.riskScore ?? "—"} · Incidents{" "}
              {snapshot.predictedIncidents ?? snapshot.incidentCount ?? "—"}
            </p>
          </div>
          {snapshot.confidence != null ? (
            <span className="text-xs font-medium text-muted">{Math.round(snapshot.confidence)}% conf.</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

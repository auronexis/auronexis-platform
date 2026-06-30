import type { HealthSnapshot } from "@/lib/health/types";
import { formatHealthTimestamp, formatHealthTrend } from "@/lib/health/types";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableEmpty,
  AuroraTableHead,
  AuroraTableHeaderCell,
} from "@/components/ui/table";

type ClientHealthHistoryProps = {
  snapshots: HealthSnapshot[];
};

export function ClientHealthHistory({ snapshots }: ClientHealthHistoryProps) {
  if (snapshots.length === 0) {
    return (
      <AuroraTableEmpty
        title="No health history available"
        description="Snapshots will appear here after health scores are calculated."
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Score</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Date</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Delta</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Reason</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {snapshots.map((snapshot) => (
            <tr key={snapshot.id} className="border-b border-border/70">
              <AuroraTableCell className="font-semibold text-foreground">{snapshot.score}</AuroraTableCell>
              <AuroraTableCell className="text-muted">
                {formatHealthTimestamp(snapshot.calculated_at)}
              </AuroraTableCell>
              <AuroraTableCell className="text-muted">{formatHealthTrend(snapshot.delta)}</AuroraTableCell>
              <AuroraTableCell className="text-muted">{snapshot.reason ?? "—"}</AuroraTableCell>
            </tr>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}

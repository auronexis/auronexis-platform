import type {
  CustomerSuccessMetrics,
  CustomerSuccessPortfolio,
  CustomerSuccessPortfolioEntry,
  PortfolioPlaybookWorkload,
} from "@/lib/customer-success/types";
import type { ClientSuccessSnapshot } from "@/lib/customer-success/types";
import type { PlaybookInstanceRow, SuccessTaskRow } from "@/lib/customer-success/queries";
import { getPlaybookName } from "@/lib/customer-success/playbook-engine";
import { computeRecoveryRate } from "@/lib/customer-success/recovery";
import { getPrimaryRiskReason } from "@/lib/customer-success/signals";

function healthRank(status: ClientSuccessSnapshot["healthStatus"]): number {
  const ranks = { critical: 5, at_risk: 4, watch: 3, stable: 2, healthy: 1, insufficient_data: 0 };
  return ranks[status] ?? 0;
}

export function buildPortfolioPriorityQueue(
  snapshots: ClientSuccessSnapshot[],
): CustomerSuccessPortfolioEntry[] {
  return snapshots
    .map((snap) => ({
      clientId: snap.clientId,
      clientName: snap.clientName,
      healthScore: snap.healthScore,
      healthStatus: snap.healthStatus,
      trend: snap.trend,
      primaryRiskReason: getPrimaryRiskReason(snap.riskSignals),
      activePlaybookName: snap.activePlaybooks[0]?.name ?? null,
      overdueTaskCount: snap.overdueTaskCount,
      openCriticalIncidentCount: snap.openIncidentCount >= 2 ? snap.openIncidentCount : 0,
      openHighRiskCount: snap.criticalRiskCount,
      nextAction: snap.nextBestAction,
      priorityRank: 0,
    }))
    .sort((a, b) => {
      const hr = healthRank(b.healthStatus) - healthRank(a.healthStatus);
      if (hr !== 0) return hr;
      if (b.overdueTaskCount !== a.overdueTaskCount) return b.overdueTaskCount - a.overdueTaskCount;
      if (b.openCriticalIncidentCount !== a.openCriticalIncidentCount) {
        return b.openCriticalIncidentCount - a.openCriticalIncidentCount;
      }
      if (b.openHighRiskCount !== a.openHighRiskCount) return b.openHighRiskCount - a.openHighRiskCount;
      if (a.trend === "declining" && b.trend !== "declining") return -1;
      if (b.trend === "declining" && a.trend !== "declining") return 1;
      const staleA = a.primaryRiskReason?.includes("stale") ? 1 : 0;
      const staleB = b.primaryRiskReason?.includes("stale") ? 1 : 0;
      return staleB - staleA;
    })
    .map((entry, index) => ({ ...entry, priorityRank: index + 1 }));
}

export function buildPlaybookWorkload(
  instances: PlaybookInstanceRow[],
  tasks: SuccessTaskRow[],
  clientNames: Map<string, string>,
): PortfolioPlaybookWorkload[] {
  const active = instances.filter((i) => ["active", "paused"].includes(i.status));
  return active.map((inst) => {
    const instTasks = tasks.filter((t) => t.playbook_instance_id === inst.id);
    const completed = instTasks.filter((t) => t.status === "completed").length;
    const isOverdue =
      inst.due_at !== null && new Date(inst.due_at) < new Date() && !inst.completed_at;
    return {
      instanceId: inst.id,
      clientId: inst.client_id,
      clientName: clientNames.get(inst.client_id) ?? "Client",
      playbookName: getPlaybookName(inst.playbook_key),
      status: inst.status as PortfolioPlaybookWorkload["status"],
      assignedToUserId: inst.assigned_to_user_id,
      dueAt: inst.due_at,
      completedTaskCount: completed,
      taskCount: instTasks.length,
      isOverdue: !!isOverdue,
    };
  });
}

export function buildPortfolioMetrics(
  instances: PlaybookInstanceRow[],
  tasks: SuccessTaskRow[],
): CustomerSuccessMetrics {
  const completed = instances.filter((i) => i.status === "completed");
  const started = instances.filter((i) => i.status !== "suggested");
  const overdueWorkCount = tasks.filter(
    (t) =>
      t.due_at &&
      new Date(t.due_at) < new Date() &&
      !["completed", "cancelled", "skipped"].includes(t.status),
  ).length;

  let averageCompletionDays: number | null = null;
  const durations = completed
    .filter((i) => i.completed_at)
    .map((i) =>
      Math.floor(
        (new Date(i.completed_at!).getTime() - new Date(i.started_at).getTime()) / 86400000,
      ),
    );
  if (durations.length > 0) {
    averageCompletionDays = Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length,
    );
  }

  const recoveryRatePercent = computeRecoveryRate(completed);
  const clientsRecovered = completed.filter(
    (i) =>
      i.recovery_score_after !== null &&
      i.recovery_score_before !== null &&
      i.recovery_score_after >= i.recovery_score_before + 15,
  ).length;

  return {
    playbooksStarted: started.length,
    playbooksCompleted: completed.length,
    recoveryRatePercent,
    averageCompletionDays,
    clientsRecovered,
    overdueWorkCount,
    hasEnoughData: started.length >= 1,
  };
}

export function summarizePortfolioCounts(
  snapshots: ClientSuccessSnapshot[],
): Pick<
  CustomerSuccessPortfolio,
  "healthyCount" | "watchCount" | "atRiskCount" | "criticalCount" | "overdueTaskCount" | "activePlaybookCount" | "recoveredClientCount"
> {
  return {
    healthyCount: snapshots.filter((s) => s.healthStatus === "healthy").length,
    watchCount: snapshots.filter((s) => s.healthStatus === "watch").length,
    atRiskCount: snapshots.filter((s) => s.healthStatus === "at_risk").length,
    criticalCount: snapshots.filter((s) => s.healthStatus === "critical").length,
    overdueTaskCount: snapshots.reduce((sum, s) => sum + s.overdueTaskCount, 0),
    activePlaybookCount: snapshots.reduce((sum, s) => sum + s.activePlaybooks.length, 0),
    recoveredClientCount: snapshots.filter((s) => s.recoveryStatus === "recovered").length,
  };
}

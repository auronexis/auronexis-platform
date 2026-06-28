import type { LaunchExecutionDashboard } from "@/lib/sales/queries";
import {
  LAUNCH_EXECUTION_TARGET_LABELS,
  type LaunchExecutionTargetKey,
} from "@/lib/sales/launch-execution-targets";

type LaunchExecutionTargetsCardProps = {
  dashboard: LaunchExecutionDashboard;
};

export function LaunchExecutionTargetsCard({ dashboard }: LaunchExecutionTargetsCardProps) {
  const keys = Object.keys(dashboard.targets) as LaunchExecutionTargetKey[];

  return (
    <section className="aurora-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Launch execution targets</h2>
          <p className="mt-1 text-sm text-muted">
            Sprint 0 goals — 20 outreach, 5 discovery calls, 2 pilots, 1 customer.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted">Overall progress</p>
          <p className="text-2xl font-semibold text-foreground">{dashboard.progress.overallPercent}%</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {keys.map((key) => {
          const target = dashboard.targets[key];
          const actual = dashboard.actual[key];
          const met = actual >= target;
          return (
            <div key={key} className="rounded-lg border border-border-subtle p-3">
              <dt className="text-xs uppercase tracking-wider text-muted">
                {LAUNCH_EXECUTION_TARGET_LABELS[key]}
              </dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">
                {actual}/{target}
              </dd>
              <p className={`text-xs ${met ? "text-emerald-600" : "text-muted"}`}>
                {met ? "Target met" : `${target - actual} remaining`}
              </p>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

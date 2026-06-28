import type { LaunchExecutionDashboard } from "@/lib/sales/queries";
import { seedTop100Agencies } from "@/lib/sales/actions";

type Top100AgenciesCardProps = {
  dashboard: LaunchExecutionDashboard;
};

export function Top100AgenciesCard({ dashboard }: Top100AgenciesCardProps) {
  return (
    <section className="aurora-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Top 100 agencies</h2>
          <p className="mt-1 text-sm text-muted">
            DACH MSP, automation, and AI agency targets for launch outreach.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted">Seeded in CRM</p>
          <p className="text-2xl font-semibold text-foreground">
            {dashboard.top100Seeded}/{dashboard.top100Total}
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {dashboard.segmentSummary.map((segment) => (
          <li
            key={`${segment.region}-${segment.agencyType}`}
            className="rounded-lg border border-border-subtle px-3 py-2 text-sm"
          >
            <span className="font-medium text-foreground">{segment.label}</span>
            <span className="text-muted"> · {segment.count} targets</span>
          </li>
        ))}
      </ul>
      <form action={seedTop100Agencies} className="mt-4">
        <button
          type="submit"
          className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
        >
          Populate Top 100 agencies
        </button>
      </form>
    </section>
  );
}

import Link from "next/link";
import { IncidentBadge } from "@/components/incidents/incident-badge";
import { formatIncidentDate } from "@/lib/incidents/types";
import type { IncidentWithRelations } from "@/lib/incidents/types";
import { cn } from "@/lib/utils/cn";

type IncidentCardProps = {
  incident: IncidentWithRelations;
  className?: string;
};

export function IncidentCard({ incident, className }: IncidentCardProps) {
  return (
    <Link
      href={`/incidents/${incident.id}`}
      className={cn(
        "block rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm transition hover:border-primary/25 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{incident.title}</p>
          <p className="mt-1 text-sm text-muted">{incident.clients?.name ?? "Unknown client"}</p>
        </div>
        <IncidentBadge kind="severity" value={incident.severity} />
      </div>
      {incident.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted">{incident.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <IncidentBadge kind="status" value={incident.status} />
        <span className="text-xs text-muted">{incident.users?.full_name ?? "Unassigned"}</span>
        <span className="text-xs text-muted">Updated {formatIncidentDate(incident.updated_at)}</span>
      </div>
    </Link>
  );
}

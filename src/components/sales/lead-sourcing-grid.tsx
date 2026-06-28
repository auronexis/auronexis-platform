import Link from "next/link";
import type { AgencyType, LeadSourceRegion } from "@/types/database";
import { AGENCY_TYPES, LEAD_SOURCE_REGIONS, TOP_100_AGENCY_CRITERIA, TOP_100_TARGET } from "@/lib/sales/lead-sourcing";

type LeadSourcingGridProps = {
  regionCounts: Record<LeadSourceRegion, number>;
  agencyCounts: Record<AgencyType, number>;
  activeRegion?: LeadSourceRegion;
  activeAgency?: AgencyType;
  totalSourced: number;
};

export function LeadSourcingGrid({
  regionCounts,
  agencyCounts,
  activeRegion,
  activeAgency,
  totalSourced,
}: LeadSourcingGridProps) {
  return (
    <div className="space-y-8">
      <section className="aurora-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Top 100 agencies</h2>
            <p className="mt-1 text-sm text-muted">Target list for first paying customer — Germany, DACH, and EU.</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">
            {totalSourced}/{TOP_100_TARGET}
          </p>
        </div>
        <ul className="mt-4 grid gap-1 sm:grid-cols-2 text-sm text-muted">
          {TOP_100_AGENCY_CRITERIA.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-foreground">Regions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {LEAD_SOURCE_REGIONS.map((region) => (
            <Link
              key={region.key}
              href={`/sales/sourcing?region=${region.key}`}
              className={`aurora-surface block p-5 hover:border-primary/20 ${activeRegion === region.key ? "border-primary/30 ring-1 ring-primary/20" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{region.label}</h3>
                  <p className="mt-1 text-sm text-muted">{region.description}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                  {regionCounts[region.key]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-foreground">Agency types</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AGENCY_TYPES.map((type) => (
            <Link
              key={type.key}
              href={`/sales/sourcing?agency=${type.key}`}
              className={`aurora-surface block p-5 hover:border-primary/20 ${activeAgency === type.key ? "border-primary/30 ring-1 ring-primary/20" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{type.label}</h3>
                  <p className="mt-1 text-sm text-muted">{type.description}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                  {agencyCounts[type.key]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

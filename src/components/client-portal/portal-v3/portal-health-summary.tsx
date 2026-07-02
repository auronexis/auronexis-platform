import { ClientHealthBadge } from "@/components/health/client-health-badge";
import { ClientHealthCard } from "@/components/health/client-health-card";
import { ClientHealthHistory } from "@/components/health/client-health-history";
import { PortalCard } from "@/components/client-portal/portal-ui";
import type { HealthSnapshot } from "@/lib/health/types";

type PortalHealthSummaryProps = {
  latest: HealthSnapshot | null;
  history: HealthSnapshot[];
  compact?: boolean;
};

export function PortalHealthSummary({ latest, history, compact = false }: PortalHealthSummaryProps) {
  if (compact && latest) {
    return (
      <PortalCard>
        <h2 className="text-lg font-semibold text-foreground">Health status</h2>
        <div className="mt-4">
          <ClientHealthBadge
            summary={{
              clientId: latest.client_id,
              score: latest.score,
              status: latest.status,
              delta: latest.delta,
              reason: latest.reason,
              calculatedAt: latest.calculated_at,
            }}
          />
        </div>
        {latest.reason ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">{latest.reason}</p>
        ) : null}
      </PortalCard>
    );
  }

  return (
    <>
      <ClientHealthCard snapshot={latest} />
      {!compact ? (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Health history</h2>
          <ClientHealthHistory snapshots={history} />
        </section>
      ) : null}
    </>
  );
}

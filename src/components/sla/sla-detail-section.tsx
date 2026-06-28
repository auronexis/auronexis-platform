import { SlaStatusBadge } from "@/components/sla/sla-status-badge";
import { SlaTimeline } from "@/components/sla/sla-timeline";
import { DetailSection } from "@/components/layout/detail-page";
import { formatSlaDueDate, formatSlaHours } from "@/lib/sla/calculations";
import type { EntitySlaInfo } from "@/lib/sla/types";

type SlaDetailSectionProps = {
  sla: EntitySlaInfo;
  showPolicy?: boolean;
  compact?: boolean;
};

function policySourceLabel(source: EntitySlaInfo["policySource"]): string {
  switch (source) {
    case "assigned":
      return "Assigned policy";
    case "inherited":
      return "Inherited from organization";
    default:
      return "No SLA policy";
  }
}

export function SlaDetailSection({ sla, showPolicy = true, compact = false }: SlaDetailSectionProps) {
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">SLA status</span>
          <SlaStatusBadge status={sla.status} />
        </div>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Due</dt>
            <dd className="mt-0.5 text-foreground">{formatSlaDueDate(sla.slaDueAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Remaining</dt>
            <dd className="mt-0.5 text-foreground">{sla.remainingLabel ?? "—"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <DetailSection
      title="SLA tracking"
      description="Response-time progress for this operational item."
      action={<SlaStatusBadge status={sla.status} />}
    >
      <dl className="grid gap-6 sm:grid-cols-2">
        {showPolicy ? (
          <>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Policy</dt>
              <dd className="mt-1.5">
                <p className="text-sm font-medium text-foreground">{sla.policyName ?? "—"}</p>
                <p className="mt-1 text-xs text-muted">{policySourceLabel(sla.policySource)}</p>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Incident response
              </dt>
              <dd className="mt-1.5 text-sm text-foreground">{formatSlaHours(sla.incidentHours)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Risk response
              </dt>
              <dd className="mt-1.5 text-sm text-foreground">{formatSlaHours(sla.riskHours)}</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Due date</dt>
          <dd className="mt-1.5 text-sm text-foreground">{formatSlaDueDate(sla.slaDueAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Remaining time
          </dt>
          <dd className="mt-1.5 text-sm text-foreground">{sla.remainingLabel ?? "—"}</dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-border/70 pt-6">
        <SlaTimeline sla={sla} />
      </div>
    </DetailSection>
  );
}

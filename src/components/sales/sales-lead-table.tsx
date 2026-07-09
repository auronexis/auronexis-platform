import Link from "next/link";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { PipelineStageBadge } from "@/components/sales/pipeline-stage-badge";
import type { SalesLeadWithMeta } from "@/lib/sales/queries";
import { getLeadSourceLabel } from "@/lib/sales/pipeline-stages";

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function SalesLeadTable({
  leads,
  showScores = false,
  showCreateCta = true,
}: {
  leads: SalesLeadWithMeta[];
  showScores?: boolean;
  showCreateCta?: boolean;
}) {
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Start building your B2B sales pipeline"
        description="Inbound forms, demo requests, and manually added leads appear here. Qualify prospects and move them through your pipeline."
        action={
          showCreateCta ? (
            <LinkButton href="/sales/leads/new" size="sm">
              Add first lead
            </LinkButton>
          ) : undefined
        }
        secondaryAction={
          <LinkButton href="/sales" size="sm" variant="outline">
            Sales dashboard
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-subtle">
      <table className="min-w-full divide-y divide-border-subtle text-sm">
        <thead className="bg-surface-2/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted">Contact</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Company</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Stage</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Source</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Deal value</th>
            {showScores ? (
              <>
                <th className="px-4 py-3 text-left font-medium text-muted">Pain</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Fit</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Priority</th>
              </>
            ) : null}
            <th className="px-4 py-3 text-left font-medium text-muted">Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle bg-surface-1">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-surface-2/30">
              <td className="px-4 py-3">
                <Link href={`/sales/leads/${lead.id}`} className="font-medium text-foreground hover:text-primary">
                  {lead.contact_name}
                </Link>
                <p className="text-xs text-muted">{lead.contact_email}</p>
              </td>
              <td className="px-4 py-3 text-muted">{lead.company_name ?? "—"}</td>
              <td className="px-4 py-3">
                <PipelineStageBadge stage={lead.pipeline_stage} />
              </td>
              <td className="px-4 py-3 text-muted">{getLeadSourceLabel(lead.lead_source)}</td>
              <td className="px-4 py-3">{formatCurrency(lead.lead_value ?? lead.potential_mrr ?? lead.mrr_estimate)}</td>
              {showScores ? (
                <>
                  <td className="px-4 py-3">{lead.pain_score ?? "—"}</td>
                  <td className="px-4 py-3">{lead.fit_score ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{lead.priority_score ?? "—"}</td>
                </>
              ) : null}
              <td className="px-4 py-3 text-muted">{lead.ownerName ?? "Unassigned"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

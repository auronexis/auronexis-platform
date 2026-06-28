import Link from "next/link";
import type { SalesProposal } from "@/types/database";

export function SalesProposalList({ proposals }: { proposals: SalesProposal[] }) {
  if (proposals.length === 0) {
    return (
      <p className="text-sm text-muted">
        No proposals yet. Generate one from a qualified lead to send pilot agreement and pricing.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-subtle">
      <table className="min-w-full divide-y divide-border-subtle text-sm">
        <thead className="bg-surface-2/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted">Title</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted">MRR</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Updated</th>
            <th className="px-4 py-3 text-left font-medium text-muted">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle bg-surface-1">
          {proposals.map((proposal) => (
            <tr key={proposal.id} className="hover:bg-surface-2/30">
              <td className="px-4 py-3">
                <Link href={`/sales/proposals/${proposal.id}`} className="font-medium text-foreground hover:text-primary">
                  {proposal.title}
                </Link>
              </td>
              <td className="px-4 py-3 capitalize text-muted">{proposal.status}</td>
              <td className="px-4 py-3">${Number(proposal.mrr_proposed ?? 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-muted">{new Date(proposal.updated_at).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <Link href={`/sales/proposals/${proposal.id}/export`} className="text-primary hover:underline">
                  PDF
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

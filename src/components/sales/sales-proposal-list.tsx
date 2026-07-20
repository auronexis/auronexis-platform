"use client";

import Link from "next/link";
import { FileSignature } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/link-button";
import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import type { SalesProposal } from "@/types/database";

export function SalesProposalList({ proposals }: { proposals: SalesProposal[] }) {
  const { formatMoney, formatDate } = useWorkspaceMoney();

  if (proposals.length === 0) {
    return (
      <EmptyState
        icon={FileSignature}
        title="No proposals yet"
        description="Generate a proposal from a qualified lead to send pilot agreements, pricing, and founding customer terms."
        action={
          <LinkButton href="/sales/leads" size="sm">
            Review leads
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
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted">Title</th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted">Status</th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted">MRR</th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted">Updated</th>
            <th scope="col" className="px-4 py-3 text-left font-medium text-muted">Actions</th>
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
              <td className="px-4 py-3">{formatMoney(Number(proposal.mrr_proposed ?? 0))}</td>
              <td className="px-4 py-3 text-muted">{formatDate(proposal.updated_at)}</td>
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

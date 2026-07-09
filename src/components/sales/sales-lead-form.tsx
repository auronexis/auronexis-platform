"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import { focusRing } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";
import { createSalesLead, type SalesActionState } from "@/lib/sales/actions";
import { LEAD_SOURCES, PIPELINE_STAGES } from "@/lib/sales/pipeline-stages";
import type { TeamMemberView } from "@/lib/team/types";

const initialState: SalesActionState = {};

type SalesLeadFormProps = {
  teamMembers: TeamMemberView[];
};

export function SalesLeadForm({ teamMembers }: SalesLeadFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createSalesLead, initialState);

  useEffect(() => {
    if (state.success && state.leadId) {
      router.push(`/sales/leads/${state.leadId}`);
    }
  }, [state.success, state.leadId, router]);

  return (
    <form action={formAction} className="aurora-surface max-w-3xl space-y-5 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-foreground">Company name *</span>
          <input
            required
            name="companyName"
            autoComplete="organization"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Contact name *</span>
          <input
            required
            name="contactName"
            autoComplete="name"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Contact email *</span>
          <input
            required
            type="email"
            name="contactEmail"
            autoComplete="email"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Website</span>
          <input
            name="website"
            type="url"
            autoComplete="url"
            placeholder="https://"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Company size</span>
          <input
            name="companySize"
            placeholder="e.g. 11–50"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Country</span>
          <input
            name="country"
            autoComplete="country-name"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Lead source</span>
          <select
            name="leadSource"
            defaultValue="other"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          >
            {LEAD_SOURCES.map((source) => (
              <option key={source.key} value={source.key}>
                {source.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Pipeline stage</span>
          <select
            name="pipelineStage"
            defaultValue="pilot_lead"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          >
            {PIPELINE_STAGES.map((stage) => (
              <option key={stage.key} value={stage.key}>
                {stage.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Owner</span>
          <select
            name="ownerUserId"
            defaultValue=""
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          >
            <option value="">Assign to me</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Estimated MRR</span>
          <input
            name="mrrEstimate"
            type="number"
            min={0}
            step="0.01"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Deal value</span>
          <input
            name="leadValue"
            type="number"
            min={0}
            step="0.01"
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-foreground">Notes</span>
          <textarea
            name="notes"
            rows={4}
            className="w-full rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      {state.success && !state.leadId ? <FormAlert variant="success">Lead created.</FormAlert> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create lead"}
        </Button>
        <Link
          href="/sales/leads"
          className={cn(
            "inline-flex items-center rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-foreground",
            focusRing,
          )}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

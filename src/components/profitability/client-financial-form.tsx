"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateClientFinancialAction,
  upsertClientFinancialAction,
  type ClientFinancialActionState,
} from "@/lib/profitability/actions";
import type { ClientProfitabilityRow } from "@/lib/profitability/types";

type ClientFinancialFormProps = {
  row: ClientProfitabilityRow;
};

const initialState: ClientFinancialActionState = {};

export function ClientFinancialForm({ row }: ClientFinancialFormProps) {
  const action = row.financialId
    ? updateClientFinancialAction.bind(null, row.financialId, row.clientId)
    : upsertClientFinancialAction.bind(null, row.clientId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-md border border-border bg-muted/10 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          name="monthlyRevenue"
          type="number"
          min="0"
          step="0.01"
          label="Monthly revenue"
          defaultValue={String(row.monthlyRevenue)}
          required
        />
        <Input
          name="monthlyCost"
          type="number"
          min="0"
          step="0.01"
          label="Monthly cost"
          defaultValue={String(row.monthlyCost)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`notes-${row.clientId}`} className="block text-sm font-medium text-secondary">
          Notes
        </label>
        <textarea
          id={`notes-${row.clientId}`}
          name="notes"
          rows={2}
          defaultValue={row.notes ?? ""}
          placeholder="Operational cost context or margin notes."
          className="flex w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-critical">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-success">{state.success}</p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save financials"}
      </Button>
    </form>
  );
}

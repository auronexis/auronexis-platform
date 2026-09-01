"use client";

import { useActionState } from "react";
import { retryEInvoiceIntegrationAction } from "@/lib/einvoice-integration/actions";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { formControl, formLabel } from "@/lib/ui/form-tokens";

export function EInvoiceIntegrationRetryForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: string }, formData: FormData) => {
      const salesInvoiceId = String(formData.get("salesInvoiceId") ?? "").trim();
      return retryEInvoiceIntegrationAction(salesInvoiceId);
    },
    {},
  );

  return (
    <form action={formAction} className="rounded-xl border border-border/70 p-4">
      <p className="text-sm font-medium text-foreground">Retry E-Invoice integration</p>
      <p className="mt-1 text-xs text-muted">
        For issued invoices that failed archival, retry integration without changing billing records.
        Failures are also recorded as E_INVOICE_INTEGRATION_FAILED audit events.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="salesInvoiceId" className={formLabel}>
            Sales invoice ID
          </label>
          <input
            id="salesInvoiceId"
            name="salesInvoiceId"
            type="text"
            required
            className={formControl}
            placeholder="UUID of issued sales invoice"
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={pending} loading={pending}>
          Retry archive
        </Button>
      </div>
      {state.error ? (
        <div className="mt-3">
          <FormAlert variant="warning">{state.error}</FormAlert>
        </div>
      ) : null}
      {state.success ? (
        <div className="mt-3">
          <FormAlert variant="success">{state.success}</FormAlert>
        </div>
      ) : null}
    </form>
  );
}

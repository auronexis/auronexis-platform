"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_LABELS,
} from "@/lib/clients/types";
import type { ClientActionState } from "@/lib/clients/actions";
import type { ClientView } from "@/lib/clients/types";
import { formGrid } from "@/lib/ui/form-tokens";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";

type ClientFormProps = {
  action: (
    prevState: ClientActionState,
    formData: FormData,
  ) => Promise<ClientActionState>;
  client?: ClientView;
  showRevenue: boolean;
  submitLabel: string;
  pendingLabel: string;
  disabled?: boolean;
};

const initialState: ClientActionState = {};

export function ClientForm({
  action,
  client,
  showRevenue,
  submitLabel,
  pendingLabel,
  disabled = false,
}: ClientFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  useFormActionFeedback(state, isPending, { successMessage: "Client updated" });

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection title="General" description="Core client identity and status.">
          <div className={formGrid}>
            <Input
              name="name"
              label="Client name"
              required
              defaultValue={client?.name ?? ""}
              placeholder="Acme Corp"
              disabled={disabled}
            />
            <Select
              id="status"
              name="status"
              label="Status"
              defaultValue={client?.status ?? "active"}
              disabled={disabled}
              options={CLIENT_STATUSES.map((status) => ({
                value: status,
                label: CLIENT_STATUS_LABELS[status],
              }))}
            />
          </div>
        </FormSection>

        <FormSection title="Contact" description="Primary point of contact for this client.">
          <div className={formGrid}>
            <Input
              name="contactName"
              label="Contact name"
              defaultValue={client?.contact_name ?? ""}
              placeholder="Jane Smith"
              disabled={disabled}
            />
            <Input
              name="contactEmail"
              type="email"
              label="Contact email"
              defaultValue={client?.contact_email ?? ""}
              placeholder="jane@acme.com"
              disabled={disabled}
            />
          </div>
        </FormSection>

        {showRevenue ? (
          <FormSection title="Financial" description="Revenue data for profitability insights.">
            <div className={formGrid}>
              <Input
                name="monthlyRevenue"
                type="number"
                min="0"
                step="0.01"
                label="Monthly revenue"
                defaultValue={
                  client?.monthly_revenue != null ? String(client.monthly_revenue) : ""
                }
                placeholder="5000"
                disabled={disabled}
              />
            </div>
          </FormSection>
        ) : null}

        <FormSection title="Notes" description="Operational context visible to your team.">
          <Textarea
            id="notes"
            name="notes"
            label="Notes"
            defaultValue={client?.notes ?? ""}
            placeholder="Operational context, agreements, or handoff notes."
            disabled={disabled}
          />
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        <FormFooter>
          <Button type="submit" disabled={isPending || disabled} loading={isPending} loadingText={pendingLabel}>
            {submitLabel}
          </Button>
        </FormFooter>
      </FormRoot>
    </form>
  );
}

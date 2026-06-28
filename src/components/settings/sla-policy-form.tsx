"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import type { SlaPolicyActionState } from "@/lib/sla/actions";
import { formGrid } from "@/lib/ui/form-tokens";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import type { SlaPolicy } from "@/types/database";

type SlaPolicyFormProps = {
  action: (
    prevState: SlaPolicyActionState,
    formData: FormData,
  ) => Promise<SlaPolicyActionState>;
  policy?: SlaPolicy;
  submitLabel: string;
  pendingLabel: string;
  readOnly?: boolean;
};

const initialState: SlaPolicyActionState = {};

export function SlaPolicyForm({
  action,
  policy,
  submitLabel,
  pendingLabel,
  readOnly = false,
}: SlaPolicyFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  useFormActionFeedback(state, isPending);

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection title="Policy" description="Name this SLA policy for your organization.">
          <Input
            name="name"
            label="Policy name"
            required
            defaultValue={policy?.name ?? ""}
            placeholder="Standard Response SLA"
            disabled={readOnly}
          />
        </FormSection>

        <FormSection
          title="Response times"
          description="Set at least one response time. SLA due dates are calculated from when an incident or risk is created."
        >
          <div className={formGrid}>
            <Input
              name="incidentHours"
              label="Incident response (hours)"
              type="number"
              min={1}
              step={1}
              defaultValue={policy?.incident_hours?.toString() ?? ""}
              placeholder="24"
              disabled={readOnly}
            />
            <Input
              name="riskHours"
              label="Risk response (hours)"
              type="number"
              min={1}
              step={1}
              defaultValue={policy?.risk_hours?.toString() ?? ""}
              placeholder="72"
              disabled={readOnly}
            />
          </div>
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        {!readOnly ? (
          <FormFooter>
            <Button
              type="submit"
              disabled={isPending}
              loading={isPending}
              loadingText={pendingLabel}
            >
              {submitLabel}
            </Button>
          </FormFooter>
        ) : null}
      </FormRoot>
    </form>
  );
}

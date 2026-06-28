"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Select } from "@/components/ui/select";
import { assignClientSlaPolicyAction, type SlaPolicyActionState } from "@/lib/sla/actions";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import type { SlaPolicy } from "@/types/database";

type ClientSlaPolicyFormProps = {
  clientId: string;
  policies: SlaPolicy[];
  currentPolicyId: string | null;
  defaultPolicy?: SlaPolicy | null;
  readOnly?: boolean;
};

const initialState: SlaPolicyActionState = {};

export function ClientSlaPolicyForm({
  clientId,
  policies,
  currentPolicyId,
  defaultPolicy,
  readOnly = false,
}: ClientSlaPolicyFormProps) {
  const boundAction = assignClientSlaPolicyAction.bind(null, clientId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const inheritedDefault = defaultPolicy ?? policies.find((policy) => policy.is_default) ?? null;

  useFormActionFeedback(state, isPending, { successMessage: "SLA assignment saved" });

  const policyOptions = [
    {
      value: "",
      label: inheritedDefault
        ? `Use organization default (${inheritedDefault.name})`
        : "No SLA policy",
    },
    ...policies.map((policy) => ({
      value: policy.id,
      label: `${policy.name}${policy.is_default ? " (organization default)" : ""}`,
    })),
  ];

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection
          title="SLA override"
          description="Leave unset to inherit the organization default automatically."
        >
          <Select
            id="slaPolicyId"
            name="slaPolicyId"
            label="Override SLA policy"
            defaultValue={currentPolicyId ?? ""}
            disabled={readOnly}
            options={policyOptions}
          />
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        {!readOnly ? (
          <FormFooter>
            <Button type="submit" disabled={isPending} loading={isPending} loadingText="Saving…">
              Save SLA assignment
            </Button>
          </FormFooter>
        ) : null}
      </FormRoot>
    </form>
  );
}

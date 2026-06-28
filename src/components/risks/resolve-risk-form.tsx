"use client";

import { useActionState } from "react";
import { resolveRiskAction, type RiskActionState } from "@/lib/risks/actions";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Textarea } from "@/components/ui/textarea";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";

type ResolveRiskFormProps = {
  riskId: string;
};

const initialState: RiskActionState = {};

export function ResolveRiskForm({ riskId }: ResolveRiskFormProps) {
  const boundAction = resolveRiskAction.bind(null, riskId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  useFormActionFeedback(state, isPending, { successMessage: "Risk resolved" });

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection title="Resolution" description="Document how this risk was mitigated or closed.">
          <Textarea
            id="resolutionNotes"
            name="resolutionNotes"
            label="Resolution notes"
            rows={3}
            placeholder="Summarize how this risk was mitigated or closed."
          />
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        <FormFooter>
          <Button type="submit" disabled={isPending} loading={isPending} loadingText="Resolving…">
            Mark resolved
          </Button>
        </FormFooter>
      </FormRoot>
    </form>
  );
}

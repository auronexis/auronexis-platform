"use client";

import { useActionState } from "react";
import { resolveIncidentAction, type IncidentActionState } from "@/lib/incidents/actions";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Textarea } from "@/components/ui/textarea";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";

type ResolveIncidentFormProps = {
  incidentId: string;
};

const initialState: IncidentActionState = {};

export function ResolveIncidentForm({ incidentId }: ResolveIncidentFormProps) {
  const boundAction = resolveIncidentAction.bind(null, incidentId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  useFormActionFeedback(state, isPending, { successMessage: "Incident resolved" });

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection title="Resolution" description="Document how this incident was resolved.">
          <Textarea
            id="resolutionNotes"
            name="resolutionNotes"
            label="Resolution notes"
            rows={3}
            placeholder="Summarize how this incident was resolved."
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

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { updateOrganizationAction, type TeamActionState } from "@/lib/team/actions";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";

type OrganizationFormProps = {
  organizationName: string;
};

const initialState: TeamActionState = {};

export function OrganizationForm({ organizationName }: OrganizationFormProps) {
  const [state, formAction, isPending] = useActionState(updateOrganizationAction, initialState);

  useFormActionFeedback(state, isPending, { successMessage: "Organization updated" });

  return (
    <form action={formAction}>
      <FormRoot className="max-w-lg">
        <FormSection title="Organization" description="Your organization's display name.">
          <Input
            name="name"
            label="Organization name"
            required
            defaultValue={organizationName}
            placeholder="Acme Automation"
          />
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        <FormFooter>
          <Button type="submit" disabled={isPending} loading={isPending} loadingText="Saving…">
            Save changes
          </Button>
        </FormFooter>
      </FormRoot>
    </form>
  );
}

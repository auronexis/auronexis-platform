"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { APP_LOCALES, type AppLocale } from "@/lib/i18n";
import { updateOrganizationAction, type TeamActionState } from "@/lib/team/actions";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";

type OrganizationFormProps = {
  organizationName: string;
  organizationLanguage: AppLocale;
};

const initialState: TeamActionState = {};

const LANGUAGE_OPTIONS = APP_LOCALES.map((locale) => ({
  value: locale,
  label: locale === "de" ? "German" : "English",
}));

export function OrganizationForm({
  organizationName,
  organizationLanguage,
}: OrganizationFormProps) {
  const [state, formAction, isPending] = useActionState(updateOrganizationAction, initialState);

  useFormActionFeedback(state, isPending, { successMessage: "Organization updated" });

  return (
    <form action={formAction}>
      <FormRoot className="max-w-lg">
        <FormSection
          title="Organization"
          description="Your organization's display name and default language for billing and system communications."
        >
          <Input
            name="name"
            label="Organization name"
            required
            defaultValue={organizationName}
            placeholder="Acme Automation"
          />
          <Select
            name="language"
            label="Language"
            description="Used for invoices, billing PDFs, billing emails, and future system communications."
            defaultValue={organizationLanguage}
            options={LANGUAGE_OPTIONS}
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

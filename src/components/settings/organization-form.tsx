"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  APP_CURRENCIES,
  APP_CURRENCY_LABELS,
  APP_LOCALES,
  type AppCurrency,
  type AppLocale,
} from "@/lib/i18n";
import { updateOrganizationAction, type TeamActionState } from "@/lib/team/actions";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";

type OrganizationFormProps = {
  organizationName: string;
  organizationLanguage: AppLocale;
  organizationCurrency: AppCurrency;
};

const initialState: TeamActionState = {};

const LANGUAGE_OPTIONS = APP_LOCALES.map((locale) => ({
  value: locale,
  label: locale === "de" ? "German" : "English",
}));

const CURRENCY_OPTIONS = APP_CURRENCIES.map((currency) => ({
  value: currency,
  label: APP_CURRENCY_LABELS[currency],
}));

export function OrganizationForm({
  organizationName,
  organizationLanguage,
  organizationCurrency,
}: OrganizationFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateOrganizationAction, initialState);

  useFormActionFeedback(state, isPending, { successMessage: "Organization updated" });

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form
      action={formAction}
      key={`${organizationName}-${organizationLanguage}-${organizationCurrency}`}
    >
      <FormRoot className="max-w-lg">
        <FormSection
          title="Organization"
          description="Your organization's display name, language, and workspace currency for financial displays."
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
          <Select
            name="currency"
            label="Workspace currency"
            description="Used across Sales, Profitability, forecasts, and financial widgets. Paddle subscription invoices keep their charged currency."
            defaultValue={organizationCurrency}
            options={CURRENCY_OPTIONS}
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

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
  MEASUREMENT_SYSTEM_OPTIONS,
  ORGANIZATION_TIMEZONE_OPTIONS,
  WEEK_START_OPTIONS,
  type AppCurrency,
  type AppLocale,
  type MeasurementSystem,
  type OrganizationDateFormat,
  type OrganizationTimeFormat,
  type WeekStart,
} from "@/lib/i18n";
import { DATE_FORMAT_OPTIONS } from "@/lib/profile/preferences";
import { updateOrganizationAction, type TeamActionState } from "@/lib/team/actions";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";

type OrganizationFormProps = {
  organizationName: string;
  organizationLanguage: AppLocale;
  organizationCurrency: AppCurrency;
  organizationTimezone: string;
  organizationDateFormat: OrganizationDateFormat;
  organizationTimeFormat: OrganizationTimeFormat;
  organizationWeekStart: WeekStart;
  organizationMeasurementSystem: MeasurementSystem;
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

const TIMEZONE_OPTIONS = ORGANIZATION_TIMEZONE_OPTIONS.map((zone) => ({
  value: zone,
  label: zone,
}));

const TIME_FORMAT_OPTIONS = [
  { value: "24h", label: "24-hour" },
  { value: "12h", label: "12-hour" },
];

export function OrganizationForm({
  organizationName,
  organizationLanguage,
  organizationCurrency,
  organizationTimezone,
  organizationDateFormat,
  organizationTimeFormat,
  organizationWeekStart,
  organizationMeasurementSystem,
}: OrganizationFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(updateOrganizationAction, initialState);

  useFormActionFeedback(state, isPending, { successMessage: "Organization updated" });

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const formKey = [
    organizationName,
    organizationLanguage,
    organizationCurrency,
    organizationTimezone,
    organizationDateFormat,
    organizationTimeFormat,
    organizationWeekStart,
    organizationMeasurementSystem,
  ].join("-");

  return (
    <form action={formAction} key={formKey}>
      <FormRoot className="max-w-lg">
        <FormSection
          title="Organization"
          description="Agency profile and regional defaults for workspace currency, language, dates, and timezones."
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
          <Select
            name="timezone"
            label="Timezone"
            description="Display timezone for dates and schedules. Backend timestamps remain UTC."
            defaultValue={organizationTimezone}
            options={TIMEZONE_OPTIONS}
          />
          <Select
            name="dateFormat"
            label="Date format"
            defaultValue={organizationDateFormat}
            options={DATE_FORMAT_OPTIONS}
          />
          <Select
            name="timeFormat"
            label="Time format"
            defaultValue={organizationTimeFormat}
            options={TIME_FORMAT_OPTIONS}
          />
          <Select
            name="weekStart"
            label="Week starts on"
            defaultValue={organizationWeekStart}
            options={WEEK_START_OPTIONS}
          />
          <Select
            name="measurementSystem"
            label="Measurement system"
            defaultValue={organizationMeasurementSystem}
            options={MEASUREMENT_SYSTEM_OPTIONS}
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

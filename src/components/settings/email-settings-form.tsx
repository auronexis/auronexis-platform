"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import {
  upsertOrganizationEmailSettingsAction,
  type EmailSettingsActionState,
} from "@/lib/email/organization-settings-actions";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import type { OrganizationEmailSettings } from "@/types/database";

type EmailSettingsFormProps = {
  settings: OrganizationEmailSettings | null;
  organizationName: string;
  defaultFromEmail: string;
};

const initialState: EmailSettingsActionState = {};

export function EmailSettingsForm({
  settings,
  organizationName,
  defaultFromEmail,
}: EmailSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(
    upsertOrganizationEmailSettingsAction,
    initialState,
  );

  useFormActionFeedback(state, isPending, { successMessage: "Email settings saved" });

  return (
    <form action={formAction}>
      <FormRoot className="max-w-lg">
        <FormSection
          title="Sender identity"
          description="The from email must be verified in your Resend account. If no settings are saved, the platform default sender is used."
        >
          <Input
            name="fromName"
            label="From name"
            required
            defaultValue={settings?.from_name ?? organizationName}
            placeholder="Acme Operations"
          />
          <Input
            name="fromEmail"
            type="email"
            label="From email"
            autoComplete="email"
            required
            defaultValue={settings?.from_email ?? defaultFromEmail}
            placeholder="reports@yourdomain.com"
          />
          <Input
            name="replyTo"
            type="email"
            label="Reply-to email (optional)"
            autoComplete="email"
            defaultValue={settings?.reply_to ?? ""}
            placeholder="support@yourdomain.com"
          />
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        <FormFooter>
          <Button type="submit" disabled={isPending} loading={isPending} loadingText="Saving…">
            Save email settings
          </Button>
        </FormFooter>
      </FormRoot>
    </form>
  );
}

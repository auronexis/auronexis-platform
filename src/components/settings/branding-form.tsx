"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  upsertOrganizationBrandingAction,
  type BrandingActionState,
} from "@/lib/branding/actions";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { formGrid } from "@/lib/ui/form-tokens";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import type { OrganizationBranding } from "@/types/database";

type BrandingFormProps = {
  branding: ResolvedOrganizationBranding;
  record: OrganizationBranding | null;
  organizationName: string;
  canManage: boolean;
};

const initialState: BrandingActionState = {};

export function BrandingForm({
  branding,
  record,
  organizationName,
  canManage,
}: BrandingFormProps) {
  const [state, formAction, isPending] = useActionState(
    upsertOrganizationBrandingAction,
    initialState,
  );

  useFormActionFeedback(state, isPending, { successMessage: "Branding saved" });

  if (!canManage) {
    return (
      <dl className="grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-muted">Company name</dt>
          <dd className="mt-1 text-sm text-foreground">{branding.companyName}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted">Primary color</dt>
          <dd className="mt-1 flex items-center gap-2 text-sm text-foreground">
            <span
              className="inline-block h-4 w-4 rounded border border-border"
              style={{ backgroundColor: branding.primaryColor }}
            />
            {branding.primaryColor}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted">Secondary color</dt>
          <dd className="mt-1 flex items-center gap-2 text-sm text-foreground">
            <span
              className="inline-block h-4 w-4 rounded border border-border"
              style={{ backgroundColor: branding.secondaryColor }}
            />
            {branding.secondaryColor}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted">Logo URL</dt>
          <dd className="mt-1 text-sm text-foreground">{branding.logoUrl ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-muted">Portal welcome message</dt>
          <dd className="mt-1 text-sm text-foreground">{branding.portalWelcomeMessage}</dd>
        </div>
      </dl>
    );
  }

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection title="Identity" description="How your organization appears in the client portal.">
          <Input
            name="companyName"
            label="Company name"
            required
            defaultValue={record?.company_name ?? organizationName}
            placeholder="Acme Operations"
          />
        </FormSection>

        <FormSection title="Colors" description="Brand colors used in portal theming.">
          <div className={formGrid}>
            <Input
              name="primaryColor"
              label="Primary color"
              required
              defaultValue={record?.primary_color ?? branding.primaryColor}
              placeholder="#2563EB"
            />
            <Input
              name="secondaryColor"
              label="Secondary color"
              required
              defaultValue={record?.secondary_color ?? branding.secondaryColor}
              placeholder="#071A3D"
            />
          </div>
        </FormSection>

        <FormSection title="Assets" description="Optional logo displayed in the portal.">
          <Input
            name="logoUrl"
            type="url"
            label="Logo URL"
            defaultValue={record?.logo_url ?? ""}
            placeholder="https://cdn.example.com/logo.png"
          />
        </FormSection>

        <FormSection title="Portal" description="Welcome message shown to client portal users.">
          <Textarea
            id="portalWelcomeMessage"
            name="portalWelcomeMessage"
            label="Portal welcome message"
            rows={3}
            defaultValue={record?.portal_welcome_message ?? branding.portalWelcomeMessage}
            placeholder="Your operational status and reports in one place."
          />
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        <FormFooter>
          <Button type="submit" disabled={isPending} loading={isPending} loadingText="Saving…">
            Save branding
          </Button>
        </FormFooter>
      </FormRoot>
    </form>
  );
}

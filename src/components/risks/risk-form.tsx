"use client";

import { useCallback, useActionState } from "react";
import { OperationalAIContentField } from "@/components/operational/ai/operational-ai-content-field";
import { useOptionalOperationalAI } from "@/components/operational/ai/operational-ai-provider";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RiskActionState } from "@/lib/risks/actions";
import {
  RISK_SEVERITIES,
  RISK_SEVERITY_LABELS,
  RISK_STATUS_LABELS,
  type RiskWithRelations,
} from "@/lib/risks/types";
import { formGrid } from "@/lib/ui/form-tokens";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import type { AppUser, Client, RiskSeverity, RiskStatus } from "@/types/database";

type RiskFormProps = {
  action: (
    prevState: RiskActionState,
    formData: FormData,
  ) => Promise<RiskActionState>;
  risk?: RiskWithRelations;
  clients: Pick<Client, "id" | "name">[];
  orgUsers?: Pick<AppUser, "id" | "full_name">[];
  showOwnerSelect: boolean;
  allowedStatuses: RiskStatus[];
  defaultOwnerUserId?: string;
  submitLabel: string;
  pendingLabel: string;
  aiEnabled?: boolean;
};

const initialState: RiskActionState = {};

export function RiskForm({
  action,
  risk,
  clients,
  orgUsers = [],
  showOwnerSelect,
  allowedStatuses,
  defaultOwnerUserId,
  submitLabel,
  pendingLabel,
  aiEnabled = false,
}: RiskFormProps) {
  const operationalAI = useOptionalOperationalAI();
  const useAIFields = aiEnabled && operationalAI !== null;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const defaultStatus = risk?.status ?? allowedStatuses[0] ?? "open";
  const defaultOwner = risk?.owner_user_id ?? defaultOwnerUserId ?? orgUsers[0]?.id ?? "";

  useFormActionFeedback(state, isPending, { successMessage: "Risk updated" });

  const syncWorkspaceMeta = useCallback(
    (patch: {
      clientId?: string;
      title?: string;
      severity?: string;
      status?: string;
      assigneeUserId?: string | null;
      dueDate?: string | null;
    }) => {
      if (useAIFields && operationalAI) {
        operationalAI.updateWorkspaceMeta(patch);
      }
    },
    [operationalAI, useAIFields],
  );

  const descriptionValue = useAIFields
    ? operationalAI!.fieldValues.description
    : risk?.description ?? "";
  const resolutionValue = useAIFields
    ? operationalAI!.fieldValues.resolution_notes
    : risk?.resolution_notes ?? "";

  return (
    <form action={formAction}>
      <FormRoot>
        <FormSection title="General" description="Risk identity, client context, and severity.">
          <div className={formGrid}>
            <div className="sm:col-span-2">
              <Input
                name="title"
                label="Risk title"
                required
                defaultValue={risk?.title ?? ""}
                placeholder="Credential expiry approaching"
                onChange={(event) => syncWorkspaceMeta({ title: event.target.value })}
              />
            </div>
            <Select
              id="clientId"
              name="clientId"
              label="Client"
              required
              defaultValue={risk?.client_id ?? ""}
              placeholder="Select a client"
              options={clients.map((client) => ({ value: client.id, label: client.name }))}
              onChange={(event) => syncWorkspaceMeta({ clientId: event.target.value })}
            />
            <Select
              id="severity"
              name="severity"
              label="Severity"
              defaultValue={risk?.severity ?? "medium"}
              options={RISK_SEVERITIES.map((severity: RiskSeverity) => ({
                value: severity,
                label: RISK_SEVERITY_LABELS[severity],
              }))}
              onChange={(event) => syncWorkspaceMeta({ severity: event.target.value })}
            />
            <Select
              id="status"
              name="status"
              label="Status"
              defaultValue={defaultStatus}
              options={allowedStatuses.map((status) => ({
                value: status,
                label: RISK_STATUS_LABELS[status],
              }))}
              onChange={(event) => syncWorkspaceMeta({ status: event.target.value })}
            />
            <Input
              name="dueDate"
              type="date"
              label="Due date"
              defaultValue={risk?.due_date ?? ""}
              onChange={(event) =>
                syncWorkspaceMeta({ dueDate: event.target.value || null })
              }
            />
          </div>
        </FormSection>

        <FormSection title="Ownership" description="Who is accountable for this risk.">
          {showOwnerSelect ? (
            <Select
              id="ownerUserId"
              name="ownerUserId"
              label="Owner"
              required
              defaultValue={defaultOwner}
              options={orgUsers.map((user) => ({ value: user.id, label: user.full_name }))}
              onChange={(event) =>
                syncWorkspaceMeta({ assigneeUserId: event.target.value || null })
              }
            />
          ) : (
            <input type="hidden" name="ownerUserId" value={defaultOwnerUserId ?? defaultOwner} />
          )}
        </FormSection>

        <FormSection title="Details" description="Impact assessment and resolution notes.">
          {useAIFields && operationalAI ? (
            <>
              <OperationalAIContentField
                field="description"
                name="description"
                label="Description"
                value={descriptionValue}
                onChange={(value) => operationalAI.setFieldValue("description", value)}
                placeholder="Describe the operational threat and context."
              />
              <OperationalAIContentField
                field="resolution_notes"
                name="resolutionNotes"
                label="Resolution notes"
                rows={3}
                value={resolutionValue}
                onChange={(value) => operationalAI.setFieldValue("resolution_notes", value)}
                placeholder="Document mitigation steps or resolution details."
              />
            </>
          ) : (
            <>
              <Textarea
                id="description"
                name="description"
                label="Description"
                defaultValue={risk?.description ?? ""}
                placeholder="Describe the operational threat and context."
              />
              <Textarea
                id="resolutionNotes"
                name="resolutionNotes"
                label="Resolution notes"
                rows={3}
                defaultValue={risk?.resolution_notes ?? ""}
                placeholder="Document mitigation steps or resolution details."
              />
            </>
          )}
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        <FormFooter>
          <Button type="submit" disabled={isPending} loading={isPending} loadingText={pendingLabel}>
            {submitLabel}
          </Button>
        </FormFooter>
      </FormRoot>
    </form>
  );
}

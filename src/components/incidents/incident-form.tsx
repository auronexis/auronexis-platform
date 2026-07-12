"use client";

import { useCallback, useActionState, useMemo, useState } from "react";
import { OperationalAIContentField } from "@/components/operational/ai/operational-ai-content-field";
import { useOptionalOperationalAI } from "@/components/operational/ai/operational-ai-provider";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { IncidentActionState } from "@/lib/incidents/actions";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  getIncidentLinkedRiskId,
  getIncidentLinkedRiskTitle,
  toDateTimeLocalValue,
  type IncidentWithRelations,
  type RiskOption,
} from "@/lib/incidents/types";
import { formGrid } from "@/lib/ui/form-tokens";
import { markPendingAnalyticsEvent } from "@/lib/analytics/pending-events";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import type { AppUser, Client, IncidentSeverity, IncidentStatus } from "@/types/database";

type IncidentFormProps = {
  action: (
    prevState: IncidentActionState,
    formData: FormData,
  ) => Promise<IncidentActionState>;
  incident?: IncidentWithRelations;
  clients: Pick<Client, "id" | "name">[];
  risks: RiskOption[];
  orgUsers?: Pick<AppUser, "id" | "full_name">[];
  showAssigneeSelect: boolean;
  allowedStatuses: IncidentStatus[];
  defaultAssignedUserId?: string;
  submitLabel: string;
  pendingLabel: string;
  aiEnabled?: boolean;
};

const initialState: IncidentActionState = {};

export function IncidentForm({
  action,
  incident,
  clients,
  risks,
  orgUsers = [],
  showAssigneeSelect,
  allowedStatuses,
  defaultAssignedUserId,
  submitLabel,
  pendingLabel,
  aiEnabled = false,
}: IncidentFormProps) {
  const operationalAI = useOptionalOperationalAI();
  const useAIFields = aiEnabled && operationalAI !== null;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const defaultClientId = incident?.client_id ?? clients[0]?.id ?? "";
  const [clientId, setClientId] = useState(defaultClientId);
  const defaultStatus = incident?.status ?? allowedStatuses[0] ?? "open";
  const defaultAssignee =
    incident?.assigned_user_id ?? defaultAssignedUserId ?? orgUsers[0]?.id ?? "";

  const filteredRisks = useMemo(
    () => risks.filter((risk) => risk.client_id === clientId),
    [clientId, risks],
  );
  const linkedRiskId = incident ? getIncidentLinkedRiskId(incident) : null;
  const linkedRiskTitle = incident ? getIncidentLinkedRiskTitle(incident) : null;
  const riskOptions = useMemo(() => {
    const options = filteredRisks.map((risk) => ({ value: risk.id, label: risk.title }));
    if (
      linkedRiskId &&
      !options.some((option) => option.value === linkedRiskId)
    ) {
      options.unshift({ value: linkedRiskId, label: linkedRiskTitle ?? "Linked risk" });
    }
    return options;
  }, [filteredRisks, linkedRiskId, linkedRiskTitle]);

  useFormActionFeedback(state, isPending, { successMessage: "Incident updated" });

  const syncWorkspaceMeta = useCallback(
    (patch: {
      clientId?: string;
      title?: string;
      severity?: string;
      status?: string;
      assigneeUserId?: string | null;
      dueDate?: string | null;
      linkedRiskId?: string | null;
    }) => {
      if (useAIFields && operationalAI) {
        operationalAI.updateWorkspaceMeta(patch);
      }
    },
    [operationalAI, useAIFields],
  );

  const descriptionValue = useAIFields
    ? operationalAI!.fieldValues.description
    : incident?.description ?? "";
  const resolutionValue = useAIFields
    ? operationalAI!.fieldValues.resolution_notes
    : incident?.resolution_notes ?? "";

  return (
    <form
      action={formAction}
      onSubmit={() => {
        if (!incident) {
          markPendingAnalyticsEvent("incident_created", { surface: "incident_form" });
        }
      }}
    >
      <FormRoot>
        <FormSection title="General" description="Incident identity and operational context.">
          <div className={formGrid}>
            <div className="sm:col-span-2">
              <Input
                name="title"
                label="Incident title"
                required
                defaultValue={incident?.title ?? ""}
                placeholder="Workflow failure blocking client delivery"
                onChange={(event) => syncWorkspaceMeta({ title: event.target.value })}
              />
            </div>
            <Select
              id="clientId"
              name="clientId"
              label="Client"
              required
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value);
                syncWorkspaceMeta({ clientId: event.target.value });
              }}
              options={clients.map((client) => ({ value: client.id, label: client.name }))}
            />
            <Select
              id="riskId"
              name="riskId"
              label="Linked risk"
              description="Optional — connect to an existing open risk."
              defaultValue={linkedRiskId ?? ""}
              options={[
                { value: "", label: "No linked risk" },
                ...riskOptions,
              ]}
              onChange={(event) =>
                syncWorkspaceMeta({ linkedRiskId: event.target.value || null })
              }
            />
            <Select
              id="severity"
              name="severity"
              label="Severity"
              defaultValue={incident?.severity ?? "medium"}
              options={INCIDENT_SEVERITIES.map((severity: IncidentSeverity) => ({
                value: severity,
                label: INCIDENT_SEVERITY_LABELS[severity],
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
                label: INCIDENT_STATUS_LABELS[status],
              }))}
              onChange={(event) => syncWorkspaceMeta({ status: event.target.value })}
            />
            <Input
              name="occurredAt"
              type="datetime-local"
              label="Occurred at"
              required
              defaultValue={
                incident?.occurred_at
                  ? toDateTimeLocalValue(incident.occurred_at)
                  : toDateTimeLocalValue(new Date().toISOString())
              }
            />
            <Input
              name="dueAt"
              type="datetime-local"
              label="Due at"
              defaultValue={toDateTimeLocalValue(incident?.due_at)}
              onChange={(event) =>
                syncWorkspaceMeta({ dueDate: event.target.value || null })
              }
            />
          </div>
        </FormSection>

        <FormSection title="Assignment" description="Who is leading the investigation.">
          {showAssigneeSelect ? (
            <Select
              id="assignedUserId"
              name="assignedUserId"
              label="Assigned to"
              required
              defaultValue={defaultAssignee}
              options={orgUsers.map((user) => ({ value: user.id, label: user.full_name }))}
              onChange={(event) =>
                syncWorkspaceMeta({ assigneeUserId: event.target.value || null })
              }
            />
          ) : (
            <input
              type="hidden"
              name="assignedUserId"
              value={defaultAssignedUserId ?? defaultAssignee}
            />
          )}
        </FormSection>

        <FormSection title="Investigation" description="What happened and how it was resolved.">
          {useAIFields && operationalAI ? (
            <>
              <OperationalAIContentField
                field="description"
                name="description"
                label="Description"
                value={descriptionValue}
                onChange={(value) => operationalAI.setFieldValue("description", value)}
                placeholder="Describe what happened and the operational impact."
              />
              <OperationalAIContentField
                field="resolution_notes"
                name="resolutionNotes"
                label="Resolution notes"
                rows={3}
                value={resolutionValue}
                onChange={(value) => operationalAI.setFieldValue("resolution_notes", value)}
                placeholder="Document remediation steps or resolution details."
              />
            </>
          ) : (
            <>
              <Textarea
                id="description"
                name="description"
                label="Description"
                defaultValue={incident?.description ?? ""}
                placeholder="Describe what happened and the operational impact."
              />
              <Textarea
                id="resolutionNotes"
                name="resolutionNotes"
                label="Resolution notes"
                rows={3}
                defaultValue={incident?.resolution_notes ?? ""}
                placeholder="Document remediation steps or resolution details."
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

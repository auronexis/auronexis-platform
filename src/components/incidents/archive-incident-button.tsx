"use client";

import { archiveIncidentAction } from "@/lib/incidents/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type ArchiveIncidentButtonProps = {
  incidentId: string;
  incidentTitle: string;
};

export function ArchiveIncidentButton({
  incidentId,
  incidentTitle,
}: ArchiveIncidentButtonProps) {
  return (
    <ConfirmActionButton
      dialogTitle="Archive incident"
      dialogDescription={`Archive "${incidentTitle}"? It will be hidden from the active incident list.`}
      confirmLabel="Archive incident"
      successToast={`"${incidentTitle}" archived`}
      onConfirm={() => archiveIncidentAction(incidentId)}
    >
      Archive incident
    </ConfirmActionButton>
  );
}

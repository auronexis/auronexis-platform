"use client";

import { archiveClientAction } from "@/lib/clients/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type ArchiveClientButtonProps = {
  clientId: string;
  clientName: string;
};

export function ArchiveClientButton({ clientId, clientName }: ArchiveClientButtonProps) {
  return (
    <ConfirmActionButton
      dialogTitle="Archive client"
      dialogDescription={`Archive ${clientName}? The client will be hidden from the active list.`}
      dialogConsequences="Historical data, reports, and activity remain in the system."
      confirmLabel="Archive client"
      successToast={`${clientName} archived`}
      onConfirm={() => archiveClientAction(clientId)}
    >
      Archive client
    </ConfirmActionButton>
  );
}

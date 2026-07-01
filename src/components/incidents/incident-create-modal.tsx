"use client";

import { useRef } from "react";
import { IncidentForm } from "@/components/incidents/incident-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { IncidentActionState } from "@/lib/incidents/actions";
import { createIncidentAction } from "@/lib/incidents/actions";
import { STAFF_INCIDENT_STATUSES, type RiskOption } from "@/lib/incidents/types";
import type { AppUser, Client, IncidentStatus } from "@/types/database";

type IncidentCreateModalProps = {
  clients: Pick<Client, "id" | "name">[];
  risks: RiskOption[];
  orgUsers: Pick<AppUser, "id" | "full_name">[];
  showAssigneeSelect: boolean;
  defaultAssignedUserId: string;
  allowedStatuses: IncidentStatus[];
  aiEnabled?: boolean;
};

export function IncidentCreateModal({
  clients,
  risks,
  orgUsers,
  showAssigneeSelect,
  defaultAssignedUserId,
  allowedStatuses,
  aiEnabled = false,
}: IncidentCreateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (clients.length === 0) {
    return null;
  }

  const open = () => dialogRef.current?.showModal();

  return (
    <>
      <Button type="button" onClick={open}>
        Report incident
      </Button>
      <Dialog
        dialogRef={dialogRef}
        title="Report incident"
        description="Log an operational failure linked to a client. The incident opens in your command center immediately."
        className="max-w-2xl"
        onClose={() => dialogRef.current?.close()}
      >
        <IncidentForm
          action={createIncidentAction as (
            prevState: IncidentActionState,
            formData: FormData,
          ) => Promise<IncidentActionState>}
          clients={clients}
          risks={risks}
          orgUsers={orgUsers}
          showAssigneeSelect={showAssigneeSelect}
          allowedStatuses={allowedStatuses.length > 0 ? allowedStatuses : STAFF_INCIDENT_STATUSES}
          defaultAssignedUserId={defaultAssignedUserId}
          submitLabel="Create incident"
          pendingLabel="Creating…"
          aiEnabled={aiEnabled}
        />
      </Dialog>
    </>
  );
}

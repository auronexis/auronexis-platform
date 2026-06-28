"use client";

import { useRouter } from "next/navigation";
import { setReportScheduleActiveAction } from "@/lib/report-schedules/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";

type ToggleScheduleActiveButtonProps = {
  scheduleId: string;
  isActive: boolean;
};

export function ToggleScheduleActiveButton({
  scheduleId,
  isActive,
}: ToggleScheduleActiveButtonProps) {
  const router = useRouter();
  const action = isActive ? "deactivate" : "activate";

  return (
    <ConfirmActionButton
      variant={isActive ? "ghost" : "primary"}
      dialogTitle={isActive ? "Deactivate schedule" : "Activate schedule"}
      dialogDescription={`${action.charAt(0).toUpperCase()}${action.slice(1)} this schedule?`}
      confirmLabel={isActive ? "Deactivate" : "Activate"}
      successToast={isActive ? "Schedule deactivated" : "Schedule activated"}
      onConfirm={async () => {
        await setReportScheduleActiveAction(scheduleId, !isActive);
        router.refresh();
      }}
    >
      {isActive ? "Deactivate" : "Activate"}
    </ConfirmActionButton>
  );
}

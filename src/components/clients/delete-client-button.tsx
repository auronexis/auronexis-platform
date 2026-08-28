"use client";

import { useRouter } from "next/navigation";
import { deleteClientAction } from "@/lib/clients/actions";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import type { ButtonProps } from "@/components/ui/button";

type DeleteClientButtonProps = Omit<ButtonProps, "onClick" | "loading"> & {
  clientId: string;
  clientName: string;
  onDeleted?: () => void;
};

export function DeleteClientButton({
  clientId,
  clientName,
  onDeleted,
  ...buttonProps
}: DeleteClientButtonProps) {
  const router = useRouter();

  return (
    <ConfirmActionButton
      dialogTitle="Permanently delete client"
      dialogDescription={`Permanently delete archived client ${clientName}?`}
      dialogConsequences="This irreversibly removes the client and cascaded operational rows (risks, incidents, reports, schedules, portal users, health/CS history). Organization billing, sales invoices, contract acceptances, and payment records are not deleted. Prefer Archive for normal offboarding. This is not a formal GDPR erasure workflow — use Compliance DSRs for data-subject requests."
      confirmLabel="Permanently delete"
      successToast={`${clientName} permanently deleted`}
      onConfirm={async () => {
        await deleteClientAction(clientId);
        if (onDeleted) {
          onDeleted();
        } else {
          router.push("/clients");
        }
      }}
      {...buttonProps}
    >
      Delete permanently
    </ConfirmActionButton>
  );
}

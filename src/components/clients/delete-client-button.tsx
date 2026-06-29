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
      dialogTitle="Delete client"
      dialogDescription={`Permanently delete ${clientName}?`}
      dialogConsequences="This removes the client and cascades related risks, incidents, reports, and portal access."
      confirmLabel="Delete client"
      successToast={`${clientName} deleted`}
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
      Delete
    </ConfirmActionButton>
  );
}

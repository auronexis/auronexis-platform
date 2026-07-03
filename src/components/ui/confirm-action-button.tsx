"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { sanitizeCustomerMessage } from "@/lib/ui/customer-messages";

type ConfirmActionButtonProps = Omit<ButtonProps, "onClick" | "loading"> & {
  dialogTitle: string;
  dialogDescription: string;
  dialogConsequences?: string;
  confirmLabel: string;
  successToast?: string;
  onConfirm: () => void | Promise<void>;
  children: ReactNode;
};

/** Button that opens a standardized confirmation dialog before running an action. */
export function ConfirmActionButton({
  dialogTitle,
  dialogDescription,
  dialogConsequences,
  confirmLabel,
  successToast,
  onConfirm,
  children,
  variant = "danger",
  ...buttonProps
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await onConfirm();
        setOpen(false);
        if (successToast) {
          toast({ title: successToast, variant: "success" });
        }
      } catch (error) {
        toast({
          title: sanitizeCustomerMessage(error, "Something went wrong. Please try again."),
          variant: "error",
        });
      }
    });
  }

  return (
    <>
      <Button type="button" variant={variant} {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        description={dialogDescription}
        consequences={dialogConsequences}
        confirmLabel={confirmLabel}
        variant={variant === "danger" ? "danger" : "primary"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}

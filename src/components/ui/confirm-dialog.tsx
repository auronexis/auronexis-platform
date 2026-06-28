"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { motionDialogEnter } from "@/lib/ui/motion";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  consequences?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
};

/** Standard confirmation dialog — backdrop blur, Aurora spacing, danger variant. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const consequencesId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={consequences ? `${descriptionId} ${consequencesId}` : descriptionId}
      aria-modal="true"
      className={cn(
        "fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-0 shadow-xl backdrop:bg-foreground/25 backdrop:backdrop-blur-sm open:animate-none",
        motionDialogEnter,
      )}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onOpenChange(false);
        }
      }}
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-muted">
          {description}
        </p>
        {consequences ? (
          <p id={consequencesId} className="mt-2 text-sm text-foreground/80">
            {consequences}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={loading} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            loading={loading}
            loadingText={confirmLabel}
            disabled={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

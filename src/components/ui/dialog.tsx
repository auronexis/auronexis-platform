"use client";

import type { ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils/cn";
import { motionBackdropEnter, motionDialogEnter } from "@/lib/ui/motion";
import { focusRing } from "@/lib/ui/tokens";

type DialogProps = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
};

/** Native dialog with Aurora backdrop blur and entrance animation. */
export function Dialog({
  dialogRef,
  title,
  description,
  children,
  className,
  onClose,
}: DialogProps) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${title}-title`}
      aria-describedby={description ? `${title}-description` : undefined}
      className={cn(
        "fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-0 shadow-xl backdrop:bg-foreground/25 backdrop:backdrop-blur-sm open:animate-none",
        motionDialogEnter,
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
        dialogRef.current?.close();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose?.();
          dialogRef.current?.close();
        }
      }}
    >
      <div className="p-6">
        <div className="mb-4">
          <h2 id={`${title}-title`} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {description ? (
            <p id={`${title}-description`} className="mt-1 text-sm text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </dialog>
  );
}

export const dialogBackdropClass = motionBackdropEnter;

export const dialogCloseButtonClass = focusRing;

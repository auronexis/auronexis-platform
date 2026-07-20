"use client";

import { useId, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils/cn";
import { motionBackdropEnter, motionDialogEnter } from "@/lib/ui/motion";
import { focusRing } from "@/lib/ui/tokens";
import { restoreFocus } from "@/lib/a11y/focus";

type DialogProps = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
};

/** Native dialog with Aurora backdrop blur, stable labelled headings, and modal semantics. */
export function Dialog({
  dialogRef,
  title,
  description,
  children,
  className,
  onClose,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const previouslyFocused = useRef<Element | null>(null);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-0 shadow-xl backdrop:bg-foreground/25 backdrop:backdrop-blur-sm open:animate-none",
        motionDialogEnter,
        className,
      )}
      onClose={() => {
        restoreFocus(previouslyFocused.current);
        previouslyFocused.current = null;
      }}
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
      onToggle={(event) => {
        const dialog = event.currentTarget;
        if (dialog.open) {
          // Prefer the opener outside the dialog when toggle fires after focus moved in.
          const active = document.activeElement;
          if (active && !dialog.contains(active)) {
            previouslyFocused.current = active;
          } else if (!previouslyFocused.current) {
            previouslyFocused.current = active;
          }
        }
      }}
    >
      <div className="p-6">
        <div className="mb-4">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="mt-1 text-sm text-muted">
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

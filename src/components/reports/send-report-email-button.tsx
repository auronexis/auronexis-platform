"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  sendReportByEmailAction,
  type SendReportEmailActionState,
} from "@/lib/reports/email-actions";
import { motionDialogEnter } from "@/lib/ui/motion";
import { cn } from "@/lib/utils/cn";

type SendReportEmailButtonProps = {
  reportId: string;
  defaultRecipientEmail?: string | null;
};

const initialState: SendReportEmailActionState = {};

export function SendReportEmailButton({
  reportId,
  defaultRecipientEmail,
}: SendReportEmailButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const boundAction = sendReportByEmailAction.bind(null, reportId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({ title: state.success, variant: "success" });
      dialogRef.current?.close();
    }
  }, [state.success, toast]);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => dialogRef.current?.showModal()}>
        Send Report Email
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-modal="true"
        className={cn(
          "fixed left-1/2 top-1/2 z-[120] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-0 shadow-xl backdrop:bg-foreground/25 backdrop:backdrop-blur-sm open:animate-none",
          motionDialogEnter,
        )}
      >
        <form action={formAction} className="p-6">
          <div className="mb-4">
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              Send report email
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-muted">
              Delivers the branded report email with PDF attachment. Only published reports can be
              sent.
            </p>
          </div>

          <Input
            name="recipientEmail"
            type="email"
            label="Recipient email"
            required
            defaultValue={defaultRecipientEmail ?? ""}
            placeholder="client@example.com"
          />

          {state.error ? (
            <div className="mt-4">
              <FormAlert variant="error">{state.error}</FormAlert>
            </div>
          ) : null}

          <FormFooter className="mt-6 border-t-0 pt-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dialogRef.current?.close()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} loading={isPending} loadingText="Sending…">
              Send email
            </Button>
          </FormFooter>
        </form>
      </dialog>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { publishReportV2Action } from "@/lib/reports-v2/actions";
import { Button } from "@/components/ui/button";

type ReportPublishDialogProps = {
  reportId: string;
  reportTitle: string;
  disabled?: boolean;
};

export function ReportPublishDialog({
  reportId,
  reportTitle,
  disabled = false,
}: ReportPublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button type="button" disabled={disabled || pending} onClick={() => setOpen(true)}>
        Publish to portal
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Publish report</h3>
            <p className="mt-2 text-sm text-muted">
              Publish &quot;{reportTitle}&quot; to the client portal? Clients will see the latest
              published version only.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await publishReportV2Action(reportId);
                  })
                }
              >
                {pending ? "Publishing…" : "Publish"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

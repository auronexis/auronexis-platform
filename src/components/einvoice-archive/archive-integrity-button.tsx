"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { verifyEInvoiceArchiveAction } from "@/lib/einvoice-archive/actions";

export function ArchiveIntegrityButton({ archiveId }: { archiveId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await verifyEInvoiceArchiveAction(archiveId);
            setMessage(result);
          });
        }}
      >
        {pending ? "Verifying…" : "Verify integrity"}
      </Button>
      {message?.error ? <FormAlert variant="error">{message.error}</FormAlert> : null}
      {message?.success ? <FormAlert variant="success">{message.success}</FormAlert> : null}
    </div>
  );
}

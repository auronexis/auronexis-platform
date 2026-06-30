"use client";

import { useTransition } from "react";
import { generateReportV2Action } from "@/lib/reports-v2/actions";
import { Button } from "@/components/ui/button";

type GenerateReportButtonProps = {
  reportId: string;
  disabled?: boolean;
};

export function GenerateReportButton({ reportId, disabled }: GenerateReportButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          await generateReportV2Action(reportId);
          window.location.reload();
        })
      }
    >
      {pending ? "Generating…" : "Generate report"}
    </Button>
  );
}

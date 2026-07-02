"use client";

import { useTransition } from "react";
import { generateExecutiveReportAction } from "@/lib/executive-reports/actions";
import { Button } from "@/components/ui/button";

type GenerateExecutiveReportButtonProps = {
  reportId: string;
  disabled?: boolean;
  label?: string;
};

export function GenerateExecutiveReportButton({
  reportId,
  disabled = false,
  label = "Generate executive report",
}: GenerateExecutiveReportButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(() => {
          void generateExecutiveReportAction(reportId);
        });
      }}
    >
      {pending ? "Generating…" : label}
    </Button>
  );
}

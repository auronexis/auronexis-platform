"use client";

import { useTransition } from "react";
import { analyzeIncidentAction } from "@/lib/ai-incidents/actions";
import { Button } from "@/components/ui/button";

type GenerateAnalysisButtonProps = {
  incidentId: string;
  disabled?: boolean;
  label?: string;
};

export function GenerateAnalysisButton({
  incidentId,
  disabled = false,
  label = "Generate AI analysis",
}: GenerateAnalysisButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(() => {
          void analyzeIncidentAction(incidentId);
        });
      }}
    >
      {pending ? "Generating…" : label}
    </Button>
  );
}

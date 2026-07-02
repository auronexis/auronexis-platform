"use client";

import { useTransition } from "react";
import { analyzeRiskAction } from "@/lib/ai-risks/actions";
import { Button } from "@/components/ui/button";

type GenerateRiskAnalysisButtonProps = {
  riskId: string;
  disabled?: boolean;
  label?: string;
};

export function GenerateRiskAnalysisButton({
  riskId,
  disabled = false,
  label = "Generate AI analysis",
}: GenerateRiskAnalysisButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={disabled || pending}
      onClick={() => {
        startTransition(() => {
          void analyzeRiskAction(riskId);
        });
      }}
    >
      {pending ? "Generating…" : label}
    </Button>
  );
}

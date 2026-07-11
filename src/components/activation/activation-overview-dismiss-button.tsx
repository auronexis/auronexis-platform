"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type ActivationOverviewDismissButtonProps = {
  onDismiss: () => void;
  pending: boolean;
  ariaLabel?: string;
};

export function ActivationOverviewDismissButton({
  onDismiss,
  pending,
  ariaLabel = "Dismiss workspace activation overview",
}: ActivationOverviewDismissButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={ariaLabel}
      aria-busy={pending || undefined}
      onClick={onDismiss}
      className="text-muted hover:text-foreground"
    >
      {pending ? <Spinner size="sm" /> : <X className="h-4 w-4" aria-hidden />}
    </Button>
  );
}

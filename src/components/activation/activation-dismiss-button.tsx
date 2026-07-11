"use client";

import { useActionState } from "react";
import { X } from "lucide-react";
import {
  dismissActivationSurfaceAction,
  type ActivationActionState,
} from "@/lib/activation/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type ActivationDismissButtonProps = {
  surface: "welcome" | "onboarding";
  label?: string;
};

const initialState: ActivationActionState = {};

export function ActivationDismissButton({
  surface,
  label = "Dismiss",
}: ActivationDismissButtonProps) {
  const [state, action, pending] = useActionState(dismissActivationSurfaceAction, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="surface" value={surface} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending || Boolean(state.success)}
        aria-label={label}
        className="text-muted hover:text-foreground"
      >
        {pending ? <Spinner size="sm" /> : <X className="h-4 w-4" aria-hidden />}
        <span className="sr-only">{label}</span>
      </Button>
    </form>
  );
}

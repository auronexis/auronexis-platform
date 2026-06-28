"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";

type ActionState = {
  error?: string;
  success?: string;
};

type FormActionFeedbackOptions = {
  /** Toast when save completes with empty state (no success field in action). */
  successMessage?: string;
  successTitle?: string;
};

/**
 * Shows success toasts for form actions. Server errors stay inline via FormAlert.
 */
export function useFormActionFeedback(
  state: ActionState,
  isPending: boolean,
  options?: FormActionFeedbackOptions,
): void {
  const { toast } = useToast();
  const wasPending = useRef(false);
  const lastSuccessRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.success !== lastSuccessRef.current) {
      lastSuccessRef.current = state.success;
      toast({ title: state.success, variant: "success" });
    }
  }, [state.success, toast]);

  useEffect(() => {
    if (
      wasPending.current &&
      !isPending &&
      !state.error &&
      !state.success &&
      options?.successMessage
    ) {
      toast({
        title: options.successTitle ?? options.successMessage,
        variant: "success",
      });
    }
    wasPending.current = isPending;
  }, [isPending, options?.successMessage, options?.successTitle, state.error, state.success, toast]);
}

"use client";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";

type AIErrorAlertProps = {
  message: string;
  retryable?: boolean;
  onRetry?: () => void;
  onClear?: () => void;
  onCancel?: () => void;
  loading?: boolean;
};

/** Standard AI error display with optional Retry / Clear / Cancel. */
export function AIErrorAlert({
  message,
  retryable = false,
  onRetry,
  onClear,
  onCancel,
  loading = false,
}: AIErrorAlertProps) {
  return (
    <div className="space-y-2" role="alert">
      <FormAlert variant="error">{message}</FormAlert>
      <div className="flex flex-wrap gap-2">
        {retryable && onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={loading}>
            Retry
          </Button>
        ) : null}
        {onClear ? (
          <Button type="button" variant="outline" size="sm" onClick={onClear} disabled={loading}>
            Clear output
          </Button>
        ) : null}
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}

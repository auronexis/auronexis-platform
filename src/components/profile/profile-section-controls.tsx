"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  formControl,
  formControlHeight,
} from "@/lib/ui/form-tokens";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type ProfileSaveFooterProps = {
  dirty: boolean;
  saving?: boolean;
  successMessage?: string | null;
  onSave: () => void;
  onCancel: () => void;
};

export function ProfileSaveFooter({
  dirty,
  saving = false,
  successMessage,
  onSave,
  onCancel,
}: ProfileSaveFooterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-5">
        {successMessage ? (
          <p className="text-sm font-medium text-success" role="status">
            {successMessage}
          </p>
        ) : (
          <p className="text-xs text-muted">
            {dirty ? "You have unsaved changes on this device." : "All changes saved."}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!dirty || saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={!dirty || saving} loading={saving} onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

export function ProfileSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[] | readonly string[];
  disabled?: boolean;
}) {
  const normalized = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "flex cursor-pointer",
        formControlHeight,
        formControl,
        transitionInteractive,
        focusRing,
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {normalized.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

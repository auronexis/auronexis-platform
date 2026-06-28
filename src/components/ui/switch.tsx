"use client";

import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
};

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id,
}: SwitchProps) {
  const switchId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  const descriptionId = description ? `${switchId}-description` : undefined;

  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <label htmlFor={switchId} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="mt-0.5 text-xs leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out",
          focusRing,
          checked ? "border-primary/30 bg-primary" : "border-border bg-muted/20",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow-sm",
            transitionInteractive,
            checked ? "translate-x-5" : "translate-x-1",
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}

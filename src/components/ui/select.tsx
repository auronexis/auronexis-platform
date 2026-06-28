import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { auroraInputFocus, inputErrorShake } from "@/lib/ui/motion";
import { formFieldShell, formHelper, formLabel } from "@/lib/ui/form-tokens";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label: string;
  options: SelectOption[];
  error?: string;
  description?: string;
  placeholder?: string;
};

export function Select({
  className,
  label,
  options,
  error,
  description,
  placeholder,
  id,
  disabled,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className={formFieldShell}>
      <label htmlFor={selectId} className={formLabel}>
        {label}
      </label>
      {description ? <p className={formHelper}>{description}</p> : null}
      <select
        id={selectId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${selectId}-error` : description ? `${selectId}-desc` : undefined
        }
        className={cn(
          "flex h-10 w-full cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-xs",
          transitionInteractive,
          auroraInputFocus,
          focusRing,
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger",
          error && inputErrorShake,
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

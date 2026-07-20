import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { auroraInputFocus, inputErrorShake } from "@/lib/ui/motion";
import {
  formControl,
  formControlHeight,
  formError,
  formFieldShell,
  formHelper,
  formLabel,
} from "@/lib/ui/form-tokens";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  description?: string;
};

export function Input({
  className,
  label,
  error,
  description,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className={formFieldShell}>
      <label htmlFor={inputId} className={formLabel}>
        {label}
      </label>
      {description ? (
        <p id={`${inputId}-desc`} className={formHelper}>
          {description}
        </p>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined
        }
        className={cn(
          "flex cursor-text",
          formControlHeight,
          formControl,
          transitionInteractive,
          auroraInputFocus,
          focusRing,
          error && "border-danger",
          error && inputErrorShake,
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className={formError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

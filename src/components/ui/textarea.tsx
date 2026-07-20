import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { auroraInputFocus, inputErrorShake } from "@/lib/ui/motion";
import {
  formControl,
  formError,
  formFieldShell,
  formHelper,
  formLabel,
} from "@/lib/ui/form-tokens";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  description?: string;
};

export function Textarea({
  className,
  label,
  error,
  description,
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className={formFieldShell}>
      <label htmlFor={textareaId} className={formLabel}>
        {label}
      </label>
      {description ? (
        <p id={`${textareaId}-desc`} className={formHelper}>
          {description}
        </p>
      ) : null}
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${textareaId}-error` : description ? `${textareaId}-desc` : undefined
        }
        className={cn(
          "flex min-h-[5rem] cursor-text resize-y",
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
        <p id={`${textareaId}-error`} className={formError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

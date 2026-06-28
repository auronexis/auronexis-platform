import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { auroraInputFocus, inputErrorShake } from "@/lib/ui/motion";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-foreground/80 transition-colors duration-150"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "flex h-10 w-full cursor-text rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-xs",
          transitionInteractive,
          "placeholder:text-muted/80",
          auroraInputFocus,
          focusRing,
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger",
          error && inputErrorShake,
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

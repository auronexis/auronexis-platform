import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { formFieldShell, formHelper, formLabel } from "@/lib/ui/form-tokens";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

export function Checkbox({ className, label, description, id, ...props }: CheckboxProps) {
  const checkboxId = id ?? props.name;

  return (
    <div className={cn(formFieldShell, "flex items-start gap-3")}>
      <input
        id={checkboxId}
        type="checkbox"
        className={cn(
          "mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-border text-primary",
          transitionInteractive,
          focusRing,
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <div className="min-w-0">
        <label htmlFor={checkboxId} className={cn(formLabel, "cursor-pointer")}>
          {label}
        </label>
        {description ? <p className={cn(formHelper, "mt-0.5")}>{description}</p> : null}
      </div>
    </div>
  );
}

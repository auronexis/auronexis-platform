"use client";

import { OperationalAIFieldLabel } from "@/components/operational/ai/operational-ai-floating-trigger";
import type { OperationalFieldKey } from "@/lib/ai/operational/types";
import { formFieldShell } from "@/lib/ui/form-tokens";
import { auroraInputFocus } from "@/lib/ui/motion";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type OperationalAIContentFieldProps = {
  field: OperationalFieldKey;
  name: string;
  label: string;
  rows?: number;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function OperationalAIContentField({
  field,
  name,
  label,
  rows = 4,
  placeholder,
  value,
  onChange,
}: OperationalAIContentFieldProps) {
  return (
    <div className={formFieldShell}>
      <OperationalAIFieldLabel field={field} htmlFor={name} label={label} />
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex min-h-[5rem] w-full cursor-text resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-xs",
          transitionInteractive,
          "placeholder:text-muted/80",
          auroraInputFocus,
          focusRing,
        )}
      />
    </div>
  );
}

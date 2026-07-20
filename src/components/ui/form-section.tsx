import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { formSectionGap } from "@/lib/ui/form-tokens";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

type FormRootProps = {
  children: ReactNode;
  className?: string;
};

export function FormRoot({ children, className }: FormRootProps) {
  return <div className={cn(formSectionGap, className)}>{children}</div>;
}

type FormFooterProps = {
  children: ReactNode;
  secondary?: ReactNode;
  className?: string;
};

export function FormFooter({ children, secondary, className }: FormFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap gap-2">{secondary}</div>
      <div className="flex flex-wrap gap-2 sm:justify-end">{children}</div>
    </div>
  );
}

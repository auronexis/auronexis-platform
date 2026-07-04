import type { ReactNode } from "react";

type ReportEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function ReportEmptyState({ title, description, action }: ReportEmptyStateProps) {
  return (
    <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-muted/5 px-6 py-10 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

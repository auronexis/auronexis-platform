import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { PageDescription, PageTitle } from "@/components/ui/typography";
import { getAuroraModule, type AuroraModule } from "@/lib/ui/aurora";
import { cn } from "@/lib/utils/cn";
import { transitionInteractive } from "@/lib/ui/tokens";

type StatusChipTone = "success" | "warning" | "neutral" | "info";

type PageHeaderStatus = {
  label: string;
  tone?: StatusChipTone;
};

type PageHeaderProps = {
  module?: AuroraModule;
  eyebrow?: string;
  title: string;
  description: string;
  status?: PageHeaderStatus;
  action?: ReactNode;
};

const statusToneStyles: Record<StatusChipTone, string> = {
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
  neutral: "border-border bg-muted/10 text-muted",
  info: "border-primary/20 bg-primary/10 text-primary",
};

export function PageHeader({
  module,
  eyebrow,
  title,
  description,
  status,
  action,
}: PageHeaderProps) {
  const identity = module ? getAuroraModule(module) : null;
  const eyebrowLabel = eyebrow ?? identity?.eyebrow;

  return (
    <div
      className={cn(
        "relative mb-8 overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-surface-1 via-surface-1 to-surface-2 px-6 py-5 shadow-sm",
        identity?.accentBorder ?? "border-border/80",
        transitionInteractive,
      )}
    >
      {identity ? (
        <>
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-60",
              identity.accentGlow,
            )}
          />
          <span
            className={cn("absolute left-0 top-4 bottom-4 w-[3px] rounded-full", identity.statusBar)}
            aria-hidden
          />
        </>
      ) : null}

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 pl-3">
          {eyebrowLabel ? (
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.14em]",
                identity?.accentEyebrow ?? "text-primary",
              )}
            >
              {eyebrowLabel}
            </p>
          ) : null}
          <PageTitle className="mt-2 text-3xl">{title}</PageTitle>
          <PageDescription className="mt-2 max-w-2xl text-base">{description}</PageDescription>
          {status ? (
            <span
              className={cn(
                "mt-4 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                statusToneStyles[status.tone ?? "neutral"],
              )}
            >
              {status.label}
            </span>
          ) : null}
        </div>
        {action ? <div className="relative shrink-0 pl-3 sm:pl-0">{action}</div> : null}
      </div>
    </div>
  );
}

type ModuleIconProps = {
  module: AuroraModule;
  icon: LucideIcon;
  className?: string;
};

export function ModuleIcon({ module, icon, className }: ModuleIconProps) {
  const identity = getAuroraModule(module);

  return (
    <span
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl border",
        identity.iconContainer,
        className,
      )}
    >
      <Icon icon={icon} size="md" />
    </span>
  );
}

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

/** Placeholder for modules not yet implemented in Foundation Build v1. */
export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-gradient-to-b from-muted/5 to-surface p-12 text-center shadow-sm">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <p className="mt-6 text-xs uppercase tracking-wider text-muted/80">
        Foundation Build v1 — module shell
      </p>
    </div>
  );
}

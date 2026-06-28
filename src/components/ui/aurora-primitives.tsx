import type { HTMLAttributes, ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import type { AuroraModule } from "@/lib/ui/aurora";
import { cn } from "@/lib/utils/cn";
import { pageContainer, pageSection } from "@/lib/ui/tokens";

type AuroraPadding = "none" | "sm" | "md" | "lg";

const paddingStyles: Record<AuroraPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/** Standard Aurora content card — theme-aware surface with subtle border. */
export function AuroraCard({
  children,
  className,
  padding = "md",
  ...props
}: HTMLAttributes<HTMLDivElement> & { padding?: AuroraPadding }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-surface-1 shadow-sm",
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type AuroraSectionProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: AuroraPadding;
};

/** Section block with optional heading and Aurora card surface. */
export function AuroraSection({
  title,
  description,
  action,
  children,
  className,
  padding = "md",
}: AuroraSectionProps) {
  return (
    <section className={cn(pageSection, className)}>
      {title || description || action ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
            ) : null}
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <AuroraCard padding={padding}>{children}</AuroraCard>
    </section>
  );
}

type PageShellProps = {
  module?: AuroraModule;
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Page wrapper with optional Aurora header and consistent vertical rhythm. */
export function PageShell({
  module,
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn(pageContainer, className)}>
      {title ? (
        <PageHeader
          module={module}
          eyebrow={eyebrow}
          title={title}
          description={description ?? ""}
          action={action}
        />
      ) : null}
      {children}
    </div>
  );
}

/** Shared legacy form card replacement class string. */
export const auroraFormSurfaceClass =
  "rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm";

/** Shared empty-state surface for gated or locked modules. */
export const auroraEmptyStateClass =
  "rounded-2xl border border-dashed border-border-strong bg-surface-1 p-12 text-center";

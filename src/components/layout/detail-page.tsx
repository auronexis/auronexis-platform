import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Icon } from "@/components/ui/icon";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import type { AuroraModule } from "@/lib/ui/aurora";
import { cn } from "@/lib/utils/cn";
import {
  dashboardDetailRailAside,
  dashboardDetailRailSticky,
  detailSectionScrollMargin,
  focusRing,
  linkText,
  transitionInteractive,
} from "@/lib/ui/tokens";

type DetailPageHeaderProps = {
  module: AuroraModule;
  title: string;
  description?: string;
  eyebrow?: string;
  meta?: ReactNode;
  backHref: string;
  backLabel: string;
  actions?: ReactNode;
};

/** Premium entity detail header with module accent, metadata, and actions. */
export function DetailPageHeader({
  module,
  title,
  description,
  eyebrow,
  meta,
  backHref,
  backLabel,
  actions,
}: DetailPageHeaderProps) {
  return (
    <div className="mb-8 space-y-4">
      <Link
        href={backHref}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium text-muted",
          transitionInteractive,
          "hover:text-foreground",
          focusRing,
        )}
      >
        <Icon icon={ArrowLeft} size="sm" />
        {backLabel}
      </Link>

      <PageHeader
        module={module}
        eyebrow={eyebrow}
        title={title}
        description={description ?? ""}
        action={actions}
      />

      {meta ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-3">{meta}</div>
      ) : null}
    </div>
  );
}

type DetailPageLayoutProps = {
  children: ReactNode;
  rail?: ReactNode;
  secondaryNav?: ReactNode;
  className?: string;
};

/** Two-column detail workspace — sticky overview rail in grid flow (xl+). */
export function DetailPageLayout({ children, rail, secondaryNav, className }: DetailPageLayoutProps) {
  if (!rail) {
    return (
      <div className={cn("min-w-0", className)}>
        {secondaryNav}
        <div className="space-y-6">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]",
        className,
      )}
    >
      <div className="min-w-0">
        {secondaryNav}
        <div className="space-y-6">{children}</div>
      </div>
      <aside className={dashboardDetailRailAside}>
        <div className={dashboardDetailRailSticky}>{rail}</div>
      </aside>
    </div>
  );
}

type DetailSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: "none" | "md" | "lg";
  id?: string;
};

export function DetailSection({
  title,
  description,
  action,
  children,
  className,
  padding = "md",
  id,
}: DetailSectionProps) {
  return (
    <PageSurface padding={padding} className={cn(id && detailSectionScrollMargin, className)} id={id}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <PageSurfaceHeading title={title} description={description} className="mb-0" />
        {action}
      </div>
      {children}
    </PageSurface>
  );
}

type DetailMetadataRailProps = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function DetailMetadataRail({
  title = "Overview",
  children,
  footer,
  className,
}: DetailMetadataRailProps) {
  return (
    <PageSurface className={cn("h-fit space-y-4", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{title}</h2>
      <dl className="space-y-4">{children}</dl>
      {footer ? <div className="border-t border-border/70 pt-4">{footer}</div> : null}
    </PageSurface>
  );
}

type DetailMetadataItemProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function DetailMetadataItem({ label, children, className }: DetailMetadataItemProps) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-1.5 text-sm text-foreground">{children}</dd>
    </div>
  );
}

type DetailKpiGridProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function DetailKpiGrid({ children, className, id }: DetailKpiGridProps) {
  return (
    <div
      id={id}
      className={cn("mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", id && detailSectionScrollMargin, className)}
    >
      {children}
    </div>
  );
}

type DetailKpiStatProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function DetailKpiStat({ label, children, className }: DetailKpiStatProps) {
  return (
    <PageSurface className={cn("p-5", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <div className="mt-2">{children}</div>
    </PageSurface>
  );
}

type DetailActionSectionProps = {
  title: string;
  description: string;
  variant?: "default" | "danger";
  children: ReactNode;
};

export function DetailActionSection({
  title,
  description,
  variant = "default",
  children,
}: DetailActionSectionProps) {
  return (
    <DetailSection
      title={title}
      description={description}
      className={variant === "danger" ? "border-danger/20 bg-danger/[0.02]" : undefined}
    >
      {children}
    </DetailSection>
  );
}

type DetailEmptyProps = {
  message: string;
  className?: string;
};

export function DetailEmpty({ message, className }: DetailEmptyProps) {
  return (
    <p className={cn("rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center text-sm text-muted", className)}>
      {message}
    </p>
  );
}

type DetailMetaTextProps = {
  children: ReactNode;
  className?: string;
};

export function DetailMetaText({ children, className }: DetailMetaTextProps) {
  return <span className={cn("text-sm text-muted", className)}>{children}</span>;
}

type DetailMetaSeparatorProps = {
  className?: string;
};

export function DetailMetaSeparator({ className }: DetailMetaSeparatorProps) {
  return <span className={cn("hidden text-muted/50 sm:inline", className)} aria-hidden>·</span>;
}

export function DetailViewAllLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn(linkText, "text-sm font-medium no-underline hover:underline")}>
      {children}
    </Link>
  );
}

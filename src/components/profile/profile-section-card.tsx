"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ModuleIcon } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuroraModule } from "@/lib/ui/aurora";
import { cn } from "@/lib/utils/cn";

type ProfileSectionCardProps = {
  module?: AuroraModule;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function ProfileSectionCard({
  module = "settings",
  icon,
  title,
  description,
  badge,
  children,
  footer,
  className,
}: ProfileSectionCardProps) {
  return (
    <Card variant="elevated" className={cn("flex flex-col hover:shadow-md", className)}>
      <CardHeader className="flex-row items-start gap-4">
        <ModuleIcon module={module} icon={icon} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{title}</CardTitle>
            {badge}
          </div>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">{children}</CardContent>
      {footer ? <div className="border-t border-border/70 px-6 py-4">{footer}</div> : null}
    </Card>
  );
}

type ProfileSaveFooterProps = {
  dirty: boolean;
  saving?: boolean;
  successMessage?: string | null;
  onSave: () => void;
  onCancel: () => void;
};

export function ProfileSaveFooter({
  dirty,
  saving = false,
  successMessage,
  onSave,
  onCancel,
}: ProfileSaveFooterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-5">
        {successMessage ? (
          <p className="text-sm font-medium text-success" role="status">
            {successMessage}
          </p>
        ) : (
          <p className="text-xs text-muted">
            {dirty ? "You have unsaved changes on this device." : "All changes saved."}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!dirty || saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={!dirty || saving} loading={saving} onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  );
}

export function LocalDeviceBadge() {
  return (
    <span className="inline-flex rounded-full border border-border bg-muted/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
      This device
    </span>
  );
}

export function ComingSoonBadge() {
  return (
    <span className="inline-flex rounded-full border border-border bg-muted/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
      Coming soon
    </span>
  );
}

type ProfileFieldProps = {
  label: string;
  description?: string;
  children: ReactNode;
};

export function ProfileField({ label, description, children }: ProfileFieldProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function ProfileReadOnlyValue({ value }: { value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/5 px-3 py-2.5 text-sm text-foreground">
      {value}
    </div>
  );
}

export function ProfileSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[] | readonly string[];
  disabled?: boolean;
}) {
  const normalized = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-xs",
        "transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {normalized.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FutureFeaturePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <ComingSoonBadge />
      </div>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  );
}

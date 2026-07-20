import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ModuleIcon } from "@/components/layout/page-header";
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
      Available soon
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

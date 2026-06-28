import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SidebarSectionProps = {
  label: string;
  children: ReactNode;
  className?: string;
  collapsed?: boolean;
};

export function SidebarSection({ label, children, className, collapsed = false }: SidebarSectionProps) {
  return (
    <section className={cn("px-3", className)} aria-label={label}>
      {collapsed ? null : (
        <h2 className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted/90">
          {label}
        </h2>
      )}
      <ul className="space-y-0.5">{children}</ul>
    </section>
  );
}

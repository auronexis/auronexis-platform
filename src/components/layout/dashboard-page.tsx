import type { ReactNode } from "react";
import { dashboardStickyRailWide, dashboardStickyRailWideScrollCap } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type DashboardPageProps = {
  children: ReactNode;
  className?: string;
};

/** Standard dashboard page content wrapper — prevents horizontal overflow in grids. */
export function DashboardPage({ children, className }: DashboardPageProps) {
  return <div className={cn("min-w-0 space-y-8", className)}>{children}</div>;
}

type DashboardPageGridProps = {
  children: ReactNode;
  className?: string;
};

/** Two-column dashboard layout with optional side rail. */
export function DashboardPageGrid({ children, className }: DashboardPageGridProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

type DashboardPageMainProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardPageMain({ children, className }: DashboardPageMainProps) {
  return <div className={cn("min-w-0 space-y-6", className)}>{children}</div>;
}

type DashboardPageAsideProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardPageAside({ children, className }: DashboardPageAsideProps) {
  return (
    <aside className={cn(dashboardStickyRailWide, className)}>
      <div className={cn("space-y-6", dashboardStickyRailWideScrollCap)}>{children}</div>
    </aside>
  );
}
